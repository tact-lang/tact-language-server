import {connection} from "./connection"
import {DocumentStore} from "./document-store"
import {readFileSync} from "fs"
import {createParser, initParser} from "./parser"
import {asLspRange, asParserPoint} from "./utils/position"
import {TypeInferer} from "./TypeInferer"
import {SyntaxNode, Tree} from "web-tree-sitter"
import {LocalSearchScope, Referent} from "./psi/Referent"
import {index, IndexKey} from "./indexes"
import {CallLike, Expression, NamedNode, Node} from "./psi/Node"
import {Reference, ResolveState, ScopeProcessor} from "./psi/Reference"
import {File} from "./psi/File"
import {CompletionContext} from "./completion/CompletionContext"
import {TextDocument} from "vscode-languageserver-textdocument"
import * as lsp from "vscode-languageserver"
import * as docs from "./documentation/documentation"
import * as inlays from "./inlays/collect"
import * as foldings from "./foldings/collect"
import * as semantic from "./semantic_tokens/collect"
import * as lens from "./lens/collect"
import * as search from "./search/implementations"
import * as path from "node:path"
import {existsSync} from "node:fs"
import {LRUMap} from "./utils/lruMap"
import {ClientOptions} from "../../shared/src/config-scheme"
import {
    GetDocumentationAtPositionRequest,
    GetDocumentationAtPositionResponse,
    GetTypeAtPositionParams,
    GetTypeAtPositionRequest,
    GetTypeAtPositionResponse,
} from "../../shared/src/shared-msgtypes"
import {KeywordsCompletionProvider} from "./completion/providers/KeywordsCompletionProvider"
import {CompletionProvider} from "./completion/CompletionProvider"
import {SelfCompletionProvider} from "./completion/providers/SelfCompletionProvider"
import {ReturnCompletionProvider} from "./completion/providers/ReturnCompletionProvider"
import {BaseTy} from "./types/BaseTy"
import {PrepareRenameResult} from "vscode-languageserver-protocol/lib/common/protocol"
import {
    Constant,
    Contract,
    Field,
    Fun,
    Message,
    Primitive,
    Struct,
    Trait,
} from "./psi/TopLevelDeclarations"
import {ReferenceCompletionProvider} from "./completion/providers/ReferenceCompletionProvider"
import {OverrideCompletionProvider} from "./completion/providers/OverrideCompletionProvider"
import {TraitOrContractFieldsCompletionProvider} from "./completion/providers/TraitOrContractFieldsCompletionProvider"
import {TlbSerializationCompletionProvider} from "./completion/providers/TlbSerializationCompletionProvider"
import {MessageMethodCompletionProvider} from "./completion/providers/MessageMethodCompletionProvider"
import {MemberFunctionCompletionProvider} from "./completion/providers/MemberFunctionCompletionProvider"
import {TopLevelFunctionCompletionProvider} from "./completion/providers/TopLevelFunctionCompletionProvider"
import {glob} from "glob"
import {parentOfType} from "./psi/utils"

function getOffsetFromPosition(fileContent: string, line: number, column: number): number {
    const lines = fileContent.split("\n")
    if (line < 0 || line > lines.length) {
        return 0
    }

    const targetLine = lines[line]
    if (column < 1 || column > targetLine.length + 1) {
        return 0
    }

    let offset = 0
    for (let i = 0; i < line; i++) {
        offset += lines[i].length + 1 // +1 for '\n'
    }
    offset += column - 1
    return offset
}

const documents = new DocumentStore(connection)
let workspaceFolders: lsp.WorkspaceFolder[] | null = null

export const PARSED_FILES_CACHE = new LRUMap<string, File>({
    size: 100,
    dispose: _entries => {},
})

enum IndexRootKind {
    Stdlib = "stdlib",
    Workspace = "workspace",
}

class IndexRoot {
    constructor(
        public root: string,
        public kind: IndexRootKind,
    ) {}

    async index() {
        const rootPath = this.root.slice(7)
        const files = await glob("**/*.tact", {
            cwd: rootPath,
            ignore: "node_modules/**",
        })
        for (const filePath of files) {
            console.log("Indexing:", filePath)
            const uri = this.root + "/" + filePath
            const file = await findFile(uri)
            index.addFile(uri, file, false)
        }
    }
}

async function findFile(uri: string, content?: string | undefined) {
    const cached = PARSED_FILES_CACHE.get(uri)
    if (cached !== undefined) {
        return cached
    }

    let realContent: string
    let document: TextDocument | undefined
    try {
        document = await documents.retrieve(uri)
        if (!document) {
            realContent = content ?? readFileSync(uri.slice(7)).toString()
        } else {
            realContent = content ?? document.getText()
        }
    } catch (e) {
        realContent = content ?? readFileSync(uri.slice(7)).toString()
    }

    const parser = createParser()
    const tree = parser.parse(realContent)
    const file = new File(uri, tree)
    PARSED_FILES_CACHE.set(uri, file)
    return file
}

connection.onInitialized(async () => {
    if (!workspaceFolders || workspaceFolders.length === 0) {
        return
    }

    const reporter = await connection.window.createWorkDoneProgress()

    reporter.begin("Tact Language Server", 0)

    const rootUri = workspaceFolders![0].uri
    const stdlibNodeModules = rootUri + "/node_modules/@tact-lang/compiler/stdlib"

    let resultStdlibPath = stdlibNodeModules
    if (existsSync(resultStdlibPath.slice(7))) {
        resultStdlibPath = stdlibNodeModules
        console.log("usage stdlib from node_modules")
    } else {
        resultStdlibPath = rootUri + "/stdlib"
        console.log("usage stdlib from stdlib/ directory")
    }

    reporter.report(50, "Indexing: (1/2) Standard Library")
    const stdlibRoot = new IndexRoot(resultStdlibPath, IndexRootKind.Stdlib)
    await stdlibRoot.index()

    reporter.report(80, "Indexing: (2/2) Workspace")
    const workspaceRoot = new IndexRoot(rootUri, IndexRootKind.Workspace)
    await workspaceRoot.index()

    reporter.report(100, "Ready")

    reporter.done()
})

connection.onInitialize(async (params: lsp.InitializeParams): Promise<lsp.InitializeResult> => {
    workspaceFolders = params.workspaceFolders ?? []
    const opts = params.initializationOptions as ClientOptions
    const treeSitterUri =
        opts?.treeSitterWasmUri ?? "/Users/petrmakhnev/tact-vscode/dist/tree-sitter.wasm"
    const langUri = opts?.langWasmUri ?? "/Users/petrmakhnev/tact-vscode/dist/tree-sitter-tact.wasm"
    await initParser(treeSitterUri, langUri)

    documents.onDidOpen(async event => {
        const uri = event.document.uri
        console.log("open:", uri)

        const file = await findFile(uri)
        index.addFile(uri, file)
    })

    documents.onDidChangeContent(async event => {
        if (event.document.version === 1) {
            return
        }

        const uri = event.document.uri
        console.log("changed:", uri)

        index.removeFile(uri)

        const file = await findFile(uri, event.document.getText())
        index.addFile(uri, file)
    })

    const getContent = async (uri: string, content?: string | undefined) => {
        const document = await documents.retrieve(uri)
        if (!document) {
            return content ?? readFileSync(uri.slice(7)).toString()
        }

        return content ?? document.getText()
    }

    function nodeAtPosition(params: lsp.TextDocumentPositionParams, file: File) {
        const cursorPosition = asParserPoint(params.position)
        return file.rootNode.descendantForPosition(cursorPosition)
    }

    connection.onRequest(
        lsp.HoverRequest.type,
        async (params: lsp.HoverParams): Promise<lsp.Hover | null> => {
            const file = await findFile(params.textDocument.uri)
            const hoverNode = nodeAtPosition(params, file)

            const res = Reference.resolve(NamedNode.create(hoverNode, file))
            if (res === null) {
                return {
                    range: asLspRange(hoverNode),
                    contents: {
                        kind: "plaintext",
                        value: hoverNode.type,
                    },
                }
            }

            const doc = docs.generateDocFor(res)
            if (doc === null) return null

            return {
                range: asLspRange(hoverNode),
                contents: {
                    kind: "markdown",
                    value: doc,
                },
            }
        },
    )

    function resolveImport(uri: string, hoverNode: SyntaxNode) {
        let currentDir = path.dirname(uri.slice(7))
        if (currentDir.endsWith("sources")) {
            currentDir = path.dirname(currentDir)
        }

        let importPath = hoverNode.text.slice(1, -1)
        if (importPath.startsWith("@stdlib")) {
            importPath = "./stdlib/std/" + importPath.substring("@stdlib".length + 1)
        }

        const resolved = importPath.startsWith("./") ? currentDir + importPath.slice(1) : importPath
        let targetPath = resolved + ".tact"

        if (!existsSync(targetPath)) {
            targetPath = targetPath.replace("/std/", "/libs/")
        }

        if (!existsSync(targetPath)) {
            return []
        }

        const targetUri = "file://" + targetPath

        const startOfFile = {
            start: {
                line: 0,
                character: 0,
            },
            end: {
                line: 0,
                character: 0,
            },
        }
        return [
            {
                targetUri: targetUri,
                targetRange: startOfFile,
                targetSelectionRange: startOfFile,
                originSelectionRange: asLspRange(hoverNode),
            } as lsp.LocationLink,
        ]
    }

    connection.onRequest(
        lsp.DefinitionRequest.type,
        async (params: lsp.DefinitionParams): Promise<lsp.Location[] | lsp.LocationLink[]> => {
            const uri = params.textDocument.uri
            const file = await findFile(uri)
            const hoverNode = nodeAtPosition(params, file)

            if (hoverNode.type === "string" && hoverNode.parent?.type === "import") {
                return resolveImport(uri, hoverNode)
            }

            if (
                hoverNode.type !== "identifier" &&
                hoverNode.type !== "self" &&
                hoverNode.type !== "type_identifier"
            ) {
                return []
            }

            const element = NamedNode.create(hoverNode, file)
            const res = Reference.resolve(element)
            if (res === null) return []

            const ident = res.nameIdentifier()
            if (ident === null) return []

            return [
                {
                    uri: res.file.uri,
                    range: asLspRange(ident),
                },
            ]
        },
    )

    connection.onRequest(
        lsp.TypeDefinitionRequest.type,
        async (
            params: lsp.TypeDefinitionParams,
        ): Promise<lsp.Definition | lsp.DefinitionLink[]> => {
            const uri = params.textDocument.uri
            const file = await findFile(uri)
            const hoverNode = nodeAtPosition(params, file)

            if (
                hoverNode.type !== "identifier" &&
                hoverNode.type !== "self" &&
                hoverNode.type !== "type_identifier"
            ) {
                return []
            }

            const type = TypeInferer.inferType(new Expression(hoverNode, file))
            if (type === null) return []

            if (type instanceof BaseTy) {
                const anchor = type.anchor as NamedNode
                const name = anchor.nameIdentifier()
                if (name === null) return []
                return [
                    {
                        uri: anchor.file.uri,
                        range: asLspRange(name),
                    },
                ]
            }

            return []
        },
    )

    connection.onRequest(
        lsp.CompletionRequest.type,
        async (params: lsp.CompletionParams): Promise<lsp.CompletionItem[]> => {
            const uri = params.textDocument.uri
            const content = await getContent(uri)
            const parser = createParser()

            const offset = getOffsetFromPosition(
                content,
                params.position.line,
                params.position.character + 1,
            )
            const start = content.slice(0, offset)
            const end = content.slice(offset)

            // Let's say we want to get autocompletion in the following code:
            //
            //   fun foo(p: Builder) {
            //      p.
            //   } // ^ caret here
            //
            // Regular parsers, including those that can recover from errors, will not
            // be able to parse this code well enough for us to recognize this situation.
            // Some Language Servers try to do this, but they end up with a lot of
            // incomprehensible and complex code that doesn't work well.
            //
            // The approach we use is very simple, instead of parsing the code above,
            // we transform it into:
            //
            //    fun foo(p: Builder) {
            //       p.dummyIdentifier
            //    } // ^ caret here
            //
            // Which will be parsed without any problems now.
            //
            // Now that we have valid code, we can use `Reference.processResolveVariants`
            // to resolve `DummyIdentifier` into a list of possible variants, which will
            // become the autocompletion list. See `Reference` class documentation.
            const newContent = `${start}DummyIdentifier${end}`
            const tree = parser.parse(newContent)

            const cursorPosition = asParserPoint(params.position)
            const cursorNode = tree.rootNode.descendantForPosition(cursorPosition)
            if (cursorNode.type !== "identifier" && cursorNode.type !== "type_identifier") {
                return []
            }

            const element = new NamedNode(cursorNode, new File(uri, tree))
            const ref = new Reference(element)

            const ctx = new CompletionContext(
                newContent,
                element,
                params.position,
                params.context?.triggerKind ?? lsp.CompletionTriggerKind.Invoked,
            )

            const result: lsp.CompletionItem[] = []
            const providers: CompletionProvider[] = [
                new KeywordsCompletionProvider(),
                new TopLevelFunctionCompletionProvider(),
                new MemberFunctionCompletionProvider(),
                new MessageMethodCompletionProvider(),
                new TlbSerializationCompletionProvider(),
                new OverrideCompletionProvider(),
                new TraitOrContractFieldsCompletionProvider(),
                new SelfCompletionProvider(),
                new ReturnCompletionProvider(),
                new ReferenceCompletionProvider(ref),
            ]

            providers.forEach((provider: CompletionProvider) => {
                if (!provider.isAvailable(ctx)) return
                provider.addCompletion(ctx, result)
            })

            return result
        },
    )

    connection.onRequest(
        lsp.InlayHintRequest.type,
        async (params: lsp.InlayHintParams): Promise<lsp.InlayHint[] | null> => {
            const file = await findFile(params.textDocument.uri)
            return inlays.collect(file)
        },
    )

    connection.onRequest(
        lsp.ImplementationRequest.type,
        async (params: lsp.ImplementationParams): Promise<lsp.Definition | lsp.LocationLink[]> => {
            const uri = params.textDocument.uri
            const file = await findFile(uri)

            const elementNode = nodeAtPosition(params, file)
            if (
                elementNode.type !== "identifier" &&
                elementNode.type !== "self" &&
                elementNode.type !== "type_identifier"
            ) {
                return []
            }

            const element = NamedNode.create(elementNode, file)
            const res = Reference.resolve(element)
            if (res === null) return []

            if (res instanceof Trait) {
                return search.implementations(res).map(impl => ({
                    uri: impl.file.uri,
                    range: asLspRange(impl.nameIdentifier()!),
                }))
            }

            return []
        },
    )

    connection.onRequest(lsp.RenameRequest.type, async (params: lsp.RenameParams) => {
        const uri = params.textDocument.uri
        const file = await findFile(uri)

        const renameNode = nodeAtPosition(params, file)
        const result = new Referent(renameNode, file).findReferences(true, false, false)
        if (result.length === 0) return null

        return {
            changes: {
                [uri]: result.map(a => ({
                    range: asLspRange(a.node),
                    newText: params.newName,
                })),
            },
        }
    })

    connection.onRequest(
        lsp.PrepareRenameRequest.type,
        async (params: lsp.PrepareRenameParams): Promise<PrepareRenameResult | null> => {
            const uri = params.textDocument.uri
            const file = await findFile(uri)

            const renameNode = nodeAtPosition(params, file)
            if (renameNode.type !== "identifier" && renameNode.type !== "type_identifier") {
                return null
            }

            return {
                range: asLspRange(renameNode),
                defaultBehavior: true,
                placeholder: renameNode.text,
            }
        },
    )

    connection.onRequest(
        lsp.DocumentHighlightRequest.type,
        async (params: lsp.DocumentHighlightParams): Promise<lsp.DocumentHighlight[] | null> => {
            const file = await findFile(params.textDocument.uri)
            const highlightNode = nodeAtPosition(params, file)
            if (
                highlightNode.type !== "identifier" &&
                highlightNode.type !== "self" &&
                highlightNode.type !== "type_identifier"
            ) {
                return []
            }

            const result = new Referent(highlightNode, file).findReferences(true, true, true)
            if (result.length === 0) return null

            return result.map(value => {
                let kind: lsp.DocumentHighlightKind = lsp.DocumentHighlightKind.Read
                const parent = value.node.parent!
                if (parent.type === "assignment_statement") {
                    if (parent.childForFieldName("left")!.equals(value.node)) {
                        // left = 10
                        // ^^^^
                        kind = lsp.DocumentHighlightKind.Write
                    }
                }

                return {
                    range: asLspRange(value.node),
                    kind: kind,
                }
            })
        },
    )

    connection.onRequest(
        lsp.ReferencesRequest.type,
        async (params: lsp.ReferenceParams): Promise<lsp.Location[] | null> => {
            const uri = params.textDocument.uri
            const file = await findFile(uri)

            const referenceNode = nodeAtPosition(params, file)
            if (referenceNode.type !== "identifier" && referenceNode.type !== "type_identifier") {
                return []
            }

            const result = new Referent(referenceNode, file).findReferences(false)
            if (result.length === 0) return null

            return result.map(value => ({
                uri: value.file.uri,
                range: asLspRange(value.node),
            }))
        },
    )

    connection.onRequest(
        lsp.SignatureHelpRequest.type,
        async (params: lsp.SignatureHelpParams): Promise<lsp.SignatureHelp | null> => {
            const file = await findFile(params.textDocument.uri)

            const hoverNode = nodeAtPosition(params, file)
            const callNode = parentOfType(
                hoverNode,
                "static_call_expression",
                "method_call_expression",
            )
            if (!callNode) return null

            const call = new CallLike(callNode, file)

            const res = Reference.resolve(call.nameNode())
            if (res === null) return null

            const parametersNode = res.node.childForFieldName("parameters")
            if (!parametersNode) return null

            const parameters = parametersNode.children.filter(value => value.type == "parameter")

            // The algorithm below uses the positions of commas and parentheses to findTo find the active parameter, it is enough to find the last comma, which has a position in the line less than the cursor position. In order not to complicate the algorithm, we consider the opening bracket as a kind of comma for the zero element. If the cursor position is greater than the position of any comma, then we consider that this is the last element. the active parameter.
            //
            // foo(1000, 2000, 3000)
            //    ^    ^     ^
            //    |    |     |______ argsCommas
            //    |    |____________|
            //    |_________________|
            //
            // To find the active parameter, it is enough to find the last comma, which has a position in
            // the line less than the cursor position. To simplify the algorithm, we consider the opening
            // bracket as a kind of comma for the zero element.
            // If the cursor position is greater than the position of any comma, then we consider that this
            // is the last parameter.
            //
            // TODO: support multiline calls and functions with self

            const rawArguments = call.rawArguments()
            const argsCommas = rawArguments.filter(
                value => value.text === "," || value.text === "(",
            )

            let currentIndex = 0
            for (const [i, argComma] of argsCommas.entries()) {
                if (argComma.endPosition.column > params.position.character) {
                    // found comma after cursor
                    break
                }
                currentIndex = i
            }

            if (callNode.type === "method_call_expression") {
                // skip self
                currentIndex++
            }

            const parametersInfo: lsp.ParameterInformation[] = parameters.map(value => ({
                label: value.text,
            }))
            const parametersString = parametersInfo.map(el => el.label).join(", ")

            return {
                signatures: [
                    {
                        label: `fun ${call.name()}(${parametersString})`,
                        parameters: parametersInfo,
                        activeParameter: currentIndex,
                    },
                ],
            }
        },
    )

    connection.onRequest(
        lsp.FoldingRangeRequest.type,
        async (params: lsp.FoldingRangeParams): Promise<lsp.FoldingRange[] | null> => {
            const uri = params.textDocument.uri
            const file = await findFile(uri)
            return foldings.collect(file)
        },
    )

    connection.onRequest(
        lsp.SemanticTokensRequest.type,
        async (params: lsp.SemanticTokensParams): Promise<lsp.SemanticTokens | null> => {
            const uri = params.textDocument.uri
            const file = await findFile(uri)
            return semantic.collect(file)
        },
    )

    connection.onRequest(
        lsp.CodeLensRequest.type,
        async (params: lsp.CodeLensParams): Promise<lsp.CodeLens[]> => {
            const uri = params.textDocument.uri
            const file = await findFile(uri)
            return lens.collect(file)
        },
    )

    connection.onRequest(
        GetTypeAtPositionRequest,
        async (params: GetTypeAtPositionParams): Promise<GetTypeAtPositionResponse> => {
            const file = await findFile(params.textDocument.uri)
            if (!file) {
                return {type: null}
            }

            const cursorPosition = asParserPoint(params.position)

            let node = file.rootNode.descendantForPosition(cursorPosition)
            if (!node) {
                return {type: null}
            }
            if (node?.parent?.type === "method_call_expression") {
                node = node.parent
            }
            if (!node) {
                return {type: null}
            }

            const type = TypeInferer.inferType(new Expression(node, file))
            return {
                type: type ? type.qualifiedName() : null,
            }
        },
    )

    connection.onRequest(
        GetDocumentationAtPositionRequest,
        async (
            params: GetTypeAtPositionParams,
        ): Promise<GetDocumentationAtPositionResponse | null> => {
            const file = await findFile(params.textDocument.uri)
            const hoverNode = nodeAtPosition(params, file)

            const res = Reference.resolve(NamedNode.create(hoverNode, file))
            if (res === null) {
                return {
                    range: asLspRange(hoverNode),
                    contents: {
                        kind: "plaintext",
                        value: hoverNode.type,
                    },
                }
            }

            const doc = docs.generateDocFor(res)
            if (doc === null) return null

            return {
                range: asLspRange(hoverNode),
                contents: {
                    kind: "markdown",
                    value: doc,
                },
            }
        },
    )

    function symbolKind(node: NamedNode): lsp.SymbolKind {
        if (node instanceof Fun) {
            return lsp.SymbolKind.Function
        }
        if (node instanceof Contract) {
            return lsp.SymbolKind.Class
        }
        if (node instanceof Message) {
            return lsp.SymbolKind.Struct
        }
        if (node instanceof Struct) {
            return lsp.SymbolKind.Struct
        }
        if (node instanceof Trait) {
            return lsp.SymbolKind.TypeParameter
        }
        if (node instanceof Primitive) {
            return lsp.SymbolKind.Property
        }
        if (node instanceof Constant) {
            return lsp.SymbolKind.Constant
        }
        return lsp.SymbolKind.Object
    }

    connection.onRequest(
        lsp.DocumentSymbolRequest.type,
        async (params: lsp.DocumentSymbolParams): Promise<lsp.DocumentSymbol[]> => {
            const uri = params.textDocument.uri
            const file = await findFile(uri)

            const result: lsp.DocumentSymbol[] = []

            function createSymbol(element: NamedNode): lsp.DocumentSymbol {
                let detail = ""

                if (element instanceof Fun) {
                    detail = element.signatureText()
                } else if (element instanceof Field) {
                    const type = element.typeNode()?.node?.text ?? "unknown"
                    detail = `: ${type}`
                } else if (element instanceof Constant) {
                    const type = element.typeNode()?.node?.text ?? "unknown"
                    const value = element.value()?.node?.text ?? "unknown"
                    detail = `: ${type} = ${value}`
                }

                const kind = symbolKind(element)
                const children = symbolChildren(element)

                return {
                    name: element.name(),
                    kind: kind,
                    range: asLspRange(element.nameIdentifier()!),
                    detail: detail,
                    selectionRange: asLspRange(element.nameIdentifier()!),
                    children: children,
                }
            }

            function symbolChildren(element: NamedNode): lsp.DocumentSymbol[] {
                const children: NamedNode[] = []

                if (element instanceof Struct) {
                    children.push(...element.fields())
                }

                if (element instanceof Message) {
                    children.push(...element.fields())
                }

                if (element instanceof Contract) {
                    children.push(...element.ownConstants())
                    children.push(...element.ownFields())
                    children.push(...element.ownMethods())
                }

                if (element instanceof Trait) {
                    children.push(...element.ownConstants())
                    children.push(...element.ownFields())
                    children.push(...element.ownMethods())
                }

                return children.map(el => createSymbol(el))
            }

            file.getFuns().forEach(n => result.push(createSymbol(n)))
            file.getStructs().forEach(n => result.push(createSymbol(n)))
            file.getMessages().forEach(n => result.push(createSymbol(n)))
            file.getTraits().forEach(n => result.push(createSymbol(n)))
            file.getConstants().forEach(n => result.push(createSymbol(n)))
            file.getContracts().forEach(n => result.push(createSymbol(n)))
            file.getPrimitives().forEach(n => result.push(createSymbol(n)))

            return result
        },
    )

    connection.onRequest(
        lsp.WorkspaceSymbolRequest.type,
        async (_params: lsp.WorkspaceSymbolParams): Promise<lsp.WorkspaceSymbol[]> => {
            const result: lsp.WorkspaceSymbol[] = []

            const state = new ResolveState()
            const proc = new (class implements ScopeProcessor {
                execute(node: Node, _state: ResolveState): boolean {
                    if (!(node instanceof NamedNode)) return true

                    result.push({
                        name: node.name(),
                        containerName: "",
                        kind: symbolKind(node),
                        location: {
                            uri: node.file.uri,
                            range: asLspRange(node.nameIdentifier()!),
                        },
                    })
                    return true
                }
            })()

            index.processElementsByKey(IndexKey.Contracts, proc, state)
            index.processElementsByKey(IndexKey.Funs, proc, state)
            index.processElementsByKey(IndexKey.Messages, proc, state)
            index.processElementsByKey(IndexKey.Structs, proc, state)
            index.processElementsByKey(IndexKey.Traits, proc, state)
            index.processElementsByKey(IndexKey.Primitives, proc, state)
            index.processElementsByKey(IndexKey.Constants, proc, state)

            return result
        },
    )

    connection.onExecuteCommand(async params => {
        if (params.command !== "tact/executeGetScopeProvider") return

        const commandParams = params.arguments?.[0] as lsp.TextDocumentPositionParams
        if (!commandParams) return "Invalid parameters"

        const file = PARSED_FILES_CACHE.get(commandParams.textDocument.uri)
        if (!file) {
            return "File not found"
        }

        const node = nodeAtPosition(commandParams, file)
        if (!node) {
            return "Node not found"
        }

        const referent = new Referent(node, file)
        const scope = referent.useScope()
        if (!scope) return "Scope not found"
        if (scope instanceof LocalSearchScope) return scope.toString()
        return "GlobalSearchScope"
    })

    const _needed = TypeInferer.inferType

    console.log("Tact language server is ready!")

    return {
        capabilities: {
            textDocumentSync: lsp.TextDocumentSyncKind.Incremental,
            // codeActionProvider: true,
            documentSymbolProvider: true,
            workspaceSymbolProvider: true,
            definitionProvider: true,
            typeDefinitionProvider: true,
            renameProvider: {
                prepareProvider: true,
            },
            hoverProvider: true,
            inlayHintProvider: true,
            referencesProvider: true,
            documentHighlightProvider: true,
            foldingRangeProvider: true,
            implementationProvider: true,
            // documentFormattingProvider: true,
            completionProvider: {
                triggerCharacters: ["."],
            },
            signatureHelpProvider: {
                triggerCharacters: ["(", ","],
                retriggerCharacters: [",", " "],
            },
            semanticTokensProvider: {
                legend: {
                    tokenTypes: Object.keys(lsp.SemanticTokenTypes),
                    tokenModifiers: Object.keys(lsp.SemanticTokenModifiers),
                },
                range: false,
                full: true,
            },
            codeLensProvider: {
                resolveProvider: false,
            },
            executeCommandProvider: {
                commands: ["tact/executeGetScopeProvider"],
            },
        },
    }
})

connection.listen()
