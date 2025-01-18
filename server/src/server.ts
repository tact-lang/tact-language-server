import {connection} from "./connection"
import {DocumentStore} from "./document-store"
import {readFileSync} from "fs"
import {createParser, initParser} from "./parser"
import {asLspRange, asParserPoint} from "./utils/position"
import {TypeInferer} from "./TypeInferer"
import {SyntaxNode, Tree} from "web-tree-sitter"
import {Referent} from "./psi/Referent"
import {index} from "./indexes"
import {CallLike, Expression, NamedNode} from "./psi/Node"
import {Reference, ResolveState} from "./psi/Reference"
import {File} from "./psi/File"
import {ReferenceCompletionProcessor} from "./completion/ReferenceCompletionProcessor"
import {CompletionContext} from "./completion/CompletionContext"
import {TextDocument} from "vscode-languageserver-textdocument"
import * as lsp from "vscode-languageserver"
import * as docs from "./documentation/documentation"
import * as inlays from "./inlays/collect"
import * as foldings from "./foldings/collect"
import * as semantic from "./semantic_tokens/collect"
import * as lens from "./lens/collect"
import * as path from "node:path"
import {existsSync} from "node:fs"
import {LRUMap} from "./utils/lruMap"
import {ClientOptions} from "../../shared/src/config-scheme"
import {
    GetTypeAtPositionRequest,
    GetTypeAtPositionParams,
    GetTypeAtPositionResponse,
} from "../../shared/src/shared-msgtypes"
import {KeywordsCompletionProvider} from "./completion/providers/KeywordsCompletionProvider"
import {CompletionProvider} from "./completion/CompletionProvider"
import {SelfCompletionProvider} from "./completion/providers/SelfCompletionProvider"
import {ReturnCompletionProvider} from "./completion/providers/ReturnCompletionProvider"
import {BaseTy} from "./types/BaseTy"
import {PrepareRenameResult} from "vscode-languageserver-protocol/lib/common/protocol"

function getOffsetFromPosition(fileContent: string, line: number, column: number): number {
    const lines = fileContent.split("\n")
    if (line < 1 || line > lines.length) {
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

export const PARSED_FILES_CACHE = new LRUMap<string, Tree>({
    size: 100,
    dispose: _entries => {},
})

connection.onInitialize(async (params: lsp.InitializeParams): Promise<lsp.InitializeResult> => {
    const opts = params.initializationOptions as ClientOptions
    await initParser(opts.treeSitterWasmUri, opts.langWasmUri)

    documents.onDidOpen(async event => {
        const uri = event.document.uri
        console.log("open:", uri)

        const path = uri.substring(7)
        const file = await findFile(uri)
        index.addFile(path, file)
    })

    documents.onDidClose(event => {
        const uri = event.document.uri
        console.log("close:", uri)

        index.removeFile(uri)
    })

    documents.onDidChangeContent(async event => {
        const uri = event.document.uri
        console.log("changed:", uri)

        index.removeFile(uri)

        const file = await findFile(uri, event.document.getText())
        index.addFile(uri, file)
    })

    const findFile = async (uri: string, content?: string | undefined) => {
        const cached = PARSED_FILES_CACHE.get(uri)
        if (cached !== undefined) {
            return new File(uri, cached)
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
        PARSED_FILES_CACHE.set(uri, tree)
        return new File(uri, tree)
    }

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
            // to resolve `dummyIdentifier` into a list of possible variants, which will
            // become the autocompletion list. See `Reference` class documentation.
            const newContent = `${start}dummyIdentifier${end}`
            const tree = parser.parse(newContent)

            const cursorPosition = asParserPoint(params.position)
            const cursorNode = tree.rootNode.descendantForPosition(cursorPosition)
            if (cursorNode.type !== "identifier" && cursorNode.type !== "type_identifier") {
                return []
            }

            const element = new NamedNode(cursorNode, new File(uri, tree))
            const ref = new Reference(element)

            const ctx = new CompletionContext(
                element,
                params.position,
                params.context?.triggerKind ?? lsp.CompletionTriggerKind.Invoked,
            )

            const result: lsp.CompletionItem[] = []
            const providers: CompletionProvider[] = [
                new KeywordsCompletionProvider(),
                new SelfCompletionProvider(),
                new ReturnCompletionProvider(),
            ]

            providers.forEach((provider: CompletionProvider) => {
                if (!provider.isAvailable(ctx)) return
                provider.addCompletion(ctx, result)
            })

            const state = new ResolveState()
            const processor = new ReferenceCompletionProcessor(ctx)
            ref.processResolveVariants(processor, state)

            return [...result, ...Array.from(processor.result.values())]
        },
    )

    connection.onRequest(
        lsp.InlayHintRequest.type,
        async (params: lsp.InlayHintParams): Promise<lsp.InlayHint[] | null> => {
            const file = await findFile(params.textDocument.uri)
            return inlays.collect(file)
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
                    range: asLspRange(a),
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

            const result = new Referent(highlightNode, file).findReferences(true, true)
            if (result.length === 0) return null

            return result.map(value => {
                let kind: lsp.DocumentHighlightKind = lsp.DocumentHighlightKind.Read
                const parent = value.parent!
                if (parent.type === "assignment_statement") {
                    if (parent.childForFieldName("left")!.equals(value)) {
                        // left = 10
                        // ^^^^
                        kind = lsp.DocumentHighlightKind.Write
                    }
                }

                return {
                    range: asLspRange(value),
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
                uri: uri,
                range: asLspRange(value),
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

    const _needed = TypeInferer.inferType

    console.log("Tact language server is ready!")

    return {
        capabilities: {
            textDocumentSync: lsp.TextDocumentSyncKind.Incremental,
            // codeActionProvider: true,
            // documentSymbolProvider: true,
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
        },
    }
})

function parentOfType(node: SyntaxNode, ...types: string[]): SyntaxNode | null {
    let parent = node.parent

    while (true) {
        if (parent === null) return null
        if (types.includes(parent.type)) return parent
        parent = parent.parent
    }
}

connection.listen()
