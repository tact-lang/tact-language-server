import {connection} from "./connection"
import {DocumentStore, getOffsetFromPosition} from "./document-store"
import {createTactParser, initParser} from "./parser"
import {asLspRange, asParserPoint} from "@server/utils/position"
import {TypeInferer} from "./TypeInferer"
import {Node as SyntaxNode} from "web-tree-sitter"
import {LocalSearchScope, Referent} from "@server/psi/Referent"
import {index, IndexKey} from "./indexes"
import {CallLike, Expression, NamedNode, Node} from "@server/psi/Node"
import {Reference, ResolveState, ScopeProcessor} from "@server/psi/Reference"
import {File} from "@server/psi/File"
import {CompletionContext} from "./completion/CompletionContext"
import * as lsp from "vscode-languageserver"
import * as docs from "./documentation/documentation"
import * as inlays from "./inlays/collect"
import * as foldings from "./foldings/collect"
import * as semantic from "./semantic_tokens/collect"
import * as lens from "./lens/collect"
import * as search from "./search/implementations"
import * as path from "node:path"
import {existsSync} from "node:fs"
import {ClientOptions} from "@shared/config-scheme"
import {
    GetDocumentationAtPositionRequest,
    GetDocumentationAtPositionResponse,
    GetTypeAtPositionParams,
    GetTypeAtPositionRequest,
    GetTypeAtPositionResponse,
} from "@shared/shared-msgtypes"
import {KeywordsCompletionProvider} from "./completion/providers/KeywordsCompletionProvider"
import {CompletionProvider} from "./completion/CompletionProvider"
import {SelfCompletionProvider} from "./completion/providers/SelfCompletionProvider"
import {ReturnCompletionProvider} from "./completion/providers/ReturnCompletionProvider"
import {BaseTy} from "./types/BaseTy"
import {PrepareRenameResult} from "vscode-languageserver-protocol/lib/common/protocol"
import {Constant, Contract, Field, Fun, Message, Primitive, Struct, Trait} from "@server/psi/Decls"
import {ReferenceCompletionProvider} from "./completion/providers/ReferenceCompletionProvider"
import {OverrideCompletionProvider} from "./completion/providers/OverrideCompletionProvider"
import {TraitOrContractFieldsCompletionProvider} from "./completion/providers/TraitOrContractFieldsCompletionProvider"
import {TlbSerializationCompletionProvider} from "./completion/providers/TlbSerializationCompletionProvider"
import {MessageMethodCompletionProvider} from "./completion/providers/MessageMethodCompletionProvider"
import {MemberFunctionCompletionProvider} from "./completion/providers/MemberFunctionCompletionProvider"
import {TopLevelFunctionCompletionProvider} from "./completion/providers/TopLevelFunctionCompletionProvider"
import {measureTime, parentOfType} from "@server/psi/utils"
import {FileChangeType} from "vscode-languageserver"
import {Logger} from "@server/utils/logger"
import {MapTypeCompletionProvider} from "./completion/providers/MapTypeCompletionProvider"
import {UnusedParameterInspection} from "./inspections/UnusedParameterInspection"
import {EmptyBlockInspection} from "./inspections/EmptyBlockInspection"
import {UnusedVariableInspection} from "./inspections/UnusedVariableInspection"
import {CACHE} from "./cache"
import {
    findFile,
    IndexRoot,
    IndexRootKind,
    PARSED_FILES_CACHE,
    FIFT_PARSED_FILES_CACHE,
} from "./index-root"
import {StructInitializationInspection} from "./inspections/StructInitializationInspection"
import {AsmInstructionCompletionProvider} from "./completion/providers/AsmInstructionCompletionProvider"
import {generateAsmDoc} from "./documentation/asm_documentation"
import {clearDocumentSettings, getDocumentSettings} from "@server/utils/settings"
import {ContractDeclCompletionProvider} from "./completion/providers/ContractDeclCompletionProvider"
import {collectFift} from "./foldings/fift_collect"
import {collectFift as collectFiftSemanticTokens} from "./semantic_tokens/fift_collect"
import {FiftReference} from "@server/psi/FiftReference"
import {collectFift as collectFiftInlays} from "./inlays/fift_collect"
import {FiftReferent} from "@server/psi/FiftReferent"
import {findFiftFile} from "./index-root"
import {generateFiftDocFor} from "./documentation/fift_documentation"
import {UnusedContractMembersInspection} from "./inspections/UnusedContractMembersInspection"

/**
 * Whenever LS is initialized.
 *
 * @see initialize
 * @see initializeFallback
 */
let initialized = false

/**
 * Root folders for project.
 * Used to find files to index.
 */
let workspaceFolders: lsp.WorkspaceFolder[] | null = null

async function initialize() {
    if (!workspaceFolders || workspaceFolders.length === 0 || initialized) {
        // use fallback later, see `initializeFallback`
        return
    }

    const reporter = await connection.window.createWorkDoneProgress()

    reporter.begin("Tact Language Server", 0)

    const rootUri = workspaceFolders![0].uri
    const rootDir = rootUri.slice(7)

    const settings = await getDocumentSettings(rootUri)
    let stdlibPath = settings.stdlib.path

    if (!stdlibPath) {
        const searchDirs = [
            "node_modules/@tact-lang/compiler/src/stdlib/stdlib",
            "node_modules/@tact-lang/compiler/src/stdlib",
            "node_modules/@tact-lang/compiler/stdlib",
            "stdlib",
        ]

        stdlibPath =
            searchDirs.find(searchDir => {
                return existsSync(path.join(rootDir, searchDir))
            }) ?? null
    }

    if (!stdlibPath) {
        console.info("stdlib not found")
    } else {
        console.info(`using stdlib from ${stdlibPath}`)
    }

    if (stdlibPath) {
        reporter.report(50, "Indexing: (1/3) Standard Library")
        const stdlibRoot = new IndexRoot(stdlibPath, IndexRootKind.Stdlib)
        await stdlibRoot.index()
    }

    reporter.report(55, "Indexing: (2/3) Stubs")
    const stubsPath = path.join(__dirname, "stubs")
    const stubsRoot = new IndexRoot(`file://${stubsPath}`, IndexRootKind.Stdlib)
    await stubsRoot.index()

    reporter.report(80, "Indexing: (3/3) Workspace")
    const workspaceRoot = new IndexRoot(rootUri, IndexRootKind.Workspace)
    await workspaceRoot.index()

    reporter.report(100, "Ready")

    // When we are ready, just reload all applied highlighting and hints and clear cache
    // This way we support fast local resolving and then full resolving after indexing.
    await connection.sendRequest(lsp.SemanticTokensRefreshRequest.type)
    await connection.sendRequest(lsp.InlayHintRefreshRequest.type)
    CACHE.clear()

    reporter.done()

    initialized = true
}

connection.onInitialized(async () => {
    await initialize()
})

function findConfigFileDir(startPath: string, fileName: string): string | null {
    let currentPath = startPath

    while (true) {
        const potentialPath = path.join(currentPath, fileName)
        if (existsSync(potentialPath)) return currentPath

        const parentPath = path.dirname(currentPath)
        if (parentPath === currentPath) break

        currentPath = parentPath
    }

    return null
}

// For some reason some editors (like Neovim) doesn't pass workspace folders to initialization.
// So we need to find root first and then call initialize.
async function initializeFallback(uri: string) {
    // let's try to initialize with this way
    const projectDir = findConfigFileDir(path.dirname(uri.slice(7)), "tact.config.json")
    if (projectDir === null) {
        console.info(`project directory not found`)
        return
    }

    console.info(`found project directory: ${projectDir}`)
    workspaceFolders = [
        {
            uri: `file://${projectDir}`,
            name: path.basename(projectDir),
        },
    ]
    await initialize()
}

connection.onInitialize(async (params: lsp.InitializeParams): Promise<lsp.InitializeResult> => {
    console.info("Started new session")
    console.info("workspaceFolders:", params.workspaceFolders)

    workspaceFolders = params.workspaceFolders ?? []
    const opts = params.initializationOptions as ClientOptions
    const treeSitterUri = opts?.treeSitterWasmUri ?? `${__dirname}/tree-sitter.wasm`
    const tactLangUri = opts?.tactLangWasmUri ?? `${__dirname}/tree-sitter-tact.wasm`
    const fiftLangUri = opts?.fiftLangWasmUri ?? `${__dirname}/tree-sitter-fift.wasm`
    await initParser(treeSitterUri, tactLangUri, fiftLangUri)

    const documents = new DocumentStore(connection)

    documents.onDidOpen(async event => {
        const uri = event.document.uri
        console.info("open:", uri)

        if (!initialized) {
            await initializeFallback(uri)
        }

        const file = await findFile(uri)
        index.addFile(uri, file)
    })

    documents.onDidChangeContent(async event => {
        if (event.document.version === 1) {
            return
        }

        const uri = event.document.uri
        console.info("changed:", uri)

        if (uri.endsWith(".fif")) {
            FIFT_PARSED_FILES_CACHE.delete(uri)
            findFiftFile(uri, event.document.getText())
            return
        }

        index.fileChanged(uri)
        const file = await findFile(uri, event.document.getText(), true)
        index.addFile(uri, file, false)

        const diagnostics: lsp.Diagnostic[] = []

        const inspections = [
            new UnusedParameterInspection(),
            new EmptyBlockInspection(),
            new UnusedVariableInspection(),
            new StructInitializationInspection(),
            new UnusedContractMembersInspection(),
        ]

        for (const inspection of inspections) {
            diagnostics.push(...inspection.inspect(file))
        }

        // const compilerInspection = new CompilerInspection()
        // diagnostics.push(...await compilerInspection.inspect(file))

        await connection.sendDiagnostics({uri, diagnostics})
    })

    connection.onDidChangeWatchedFiles(async params => {
        for (const change of params.changes) {
            const uri = change.uri
            if (!uri.endsWith(".tact")) continue

            if (change.type === FileChangeType.Created) {
                console.info(`Find external create of ${uri}`)
                const file = await findFile(uri)
                index.addFile(uri, file)
                continue
            }

            if (!PARSED_FILES_CACHE.has(uri)) {
                // we don't care about this file
                continue
            }

            if (change.type === FileChangeType.Changed) {
                console.info(`Find external change of ${uri}`)
                index.fileChanged(uri)
                const file = await findFile(uri, undefined, true)
                index.addFile(uri, file, false)
            }

            if (change.type === FileChangeType.Deleted) {
                console.info(`Find external delete of ${uri}`)
                index.removeFile(uri)
            }
        }
    })

    connection.onDidChangeConfiguration(async _change => {
        clearDocumentSettings()

        await connection.sendRequest(lsp.InlayHintRefreshRequest.type)
        await connection.sendRequest(lsp.CodeLensRefreshRequest.type)
    })

    function nodeAtPosition(params: lsp.TextDocumentPositionParams, file: File) {
        const cursorPosition = asParserPoint(params.position)
        return file.rootNode.descendantForPosition(cursorPosition)
    }

    connection.onRequest(
        lsp.HoverRequest.type,
        async (params: lsp.HoverParams): Promise<lsp.Hover | null> => {
            const uri = params.textDocument.uri

            if (uri.endsWith(".fif")) {
                const file = findFiftFile(uri)
                const hoverNode = nodeAtPosition(params, file)
                if (!hoverNode || hoverNode.type !== "identifier") return null

                const doc = generateFiftDocFor(hoverNode, file)
                if (doc === null) return null

                return {
                    range: asLspRange(hoverNode),
                    contents: {
                        kind: "markdown",
                        value: doc,
                    },
                }
            }

            const file = await findFile(params.textDocument.uri)
            const hoverNode = nodeAtPosition(params, file)
            if (!hoverNode) return null

            const parent = hoverNode.parent
            if (parent?.type === "tvm_ordinary_word") {
                const doc = generateAsmDoc(hoverNode.text)
                if (doc === null) return null

                return {
                    range: asLspRange(hoverNode),
                    contents: {
                        kind: "markdown",
                        value: doc,
                    },
                }
            }

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

            if (uri.endsWith(".fif")) {
                const file = findFiftFile(uri)
                const node = nodeAtPosition(params, file)
                if (!node || node.type !== "identifier") return []

                const definition = FiftReference.resolve(node, file)
                if (!definition) return []

                return [
                    {
                        uri: file.uri,
                        range: asLspRange(definition),
                    },
                ]
            }

            const file = await findFile(uri)
            const hoverNode = nodeAtPosition(params, file)
            if (!hoverNode) return []

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
            if (res === null) {
                console.warn(`Cannot find definition for: ${hoverNode.text}`)
                return []
            }

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
            if (!hoverNode) return []
            if (
                hoverNode.type !== "identifier" &&
                hoverNode.type !== "self" &&
                hoverNode.type !== "type_identifier"
            ) {
                return []
            }

            const type = TypeInferer.inferType(new Expression(hoverNode, file))
            if (type === null) {
                console.warn(`Cannot infer type for Go to Type Definition for: ${hoverNode.text}`)
                return []
            }

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
            const file = await findFile(uri)
            const content = file.content
            const parser = createTactParser()

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
            if (!tree) return []

            const cursorPosition = asParserPoint(params.position)
            const cursorNode = tree.rootNode.descendantForPosition(cursorPosition)
            if (
                cursorNode === null ||
                (cursorNode.type !== "identifier" && cursorNode.type !== "type_identifier")
            ) {
                return []
            }

            const element = new NamedNode(cursorNode, new File(uri, tree, newContent))
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
                new MapTypeCompletionProvider(),
                new ContractDeclCompletionProvider(),
                new TopLevelFunctionCompletionProvider(),
                new MemberFunctionCompletionProvider(),
                new MessageMethodCompletionProvider(),
                new TlbSerializationCompletionProvider(),
                new OverrideCompletionProvider(),
                new TraitOrContractFieldsCompletionProvider(),
                new SelfCompletionProvider(),
                new ReturnCompletionProvider(),
                new ReferenceCompletionProvider(ref),
                new AsmInstructionCompletionProvider(),
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
            const uri = params.textDocument.uri

            if (uri.endsWith(".fif")) {
                const file = findFiftFile(uri)
                return collectFiftInlays(file)
            }

            const file = await findFile(uri)
            const settings = await getDocumentSettings(params.textDocument.uri)
            return measureTime("inlay hints", () => inlays.collect(file, settings.hints))
        },
    )

    connection.onRequest(
        lsp.ImplementationRequest.type,
        async (params: lsp.ImplementationParams): Promise<lsp.Definition | lsp.LocationLink[]> => {
            const uri = params.textDocument.uri
            const file = await findFile(uri)

            const elementNode = nodeAtPosition(params, file)
            if (!elementNode) return []
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
        if (!renameNode) return null

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
            if (!renameNode) return null
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
            if (!highlightNode) return null
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

            if (uri.endsWith(".fif")) {
                const file = findFiftFile(uri)
                const node = nodeAtPosition(params, file)
                if (!node || node.type !== "identifier") return []

                const result = new FiftReferent(node, file).findReferences(false)
                if (result.length === 0) return null

                return result.map(n => ({
                    uri: n.file.uri,
                    range: asLspRange(n.node),
                }))
            }

            const file = await findFile(uri)
            const referenceNode = nodeAtPosition(params, file)
            if (!referenceNode) return null

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
            if (!hoverNode) return null

            const callNode = parentOfType(
                hoverNode,
                "static_call_expression",
                "method_call_expression",
            )
            if (!callNode) return null

            const call = new CallLike(callNode, file)

            const res = Reference.resolve(call.nameNode())
            if (res === null) return null
            if (!(res instanceof Fun)) return null

            const parametersNode = res.node.childForFieldName("parameters")
            if (!parametersNode) return null

            const parameters = parametersNode.children
                .filter(value => value?.type === "parameter")
                .filter(value => value !== null)

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

            if (callNode.type === "method_call_expression" && res.withSelf()) {
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
        async (params: lsp.FoldingRangeParams): Promise<lsp.FoldingRange[]> => {
            const uri = params.textDocument.uri
            if (uri.endsWith(".fif")) {
                const file = findFiftFile(uri)
                return collectFift(file)
            }

            const file = await findFile(uri)
            return measureTime("folding range", () => foldings.collect(file))
        },
    )

    connection.onRequest(
        lsp.SemanticTokensRequest.type,
        async (params: lsp.SemanticTokensParams): Promise<lsp.SemanticTokens | null> => {
            const uri = params.textDocument.uri
            if (uri.endsWith(".fif")) {
                const file = findFiftFile(uri)
                return collectFiftSemanticTokens(file)
            }

            const file = await findFile(uri)
            return measureTime("semantic tokens", () => semantic.collect(file))
        },
    )

    connection.onRequest(
        lsp.CodeLensRequest.type,
        async (params: lsp.CodeLensParams): Promise<lsp.CodeLens[]> => {
            const uri = params.textDocument.uri
            const file = await findFile(uri)
            const settings = await getDocumentSettings(uri)
            return lens.collect(file, settings.codeLens.enabled)
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
            if (!hoverNode) return null

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

    console.info("Tact language server is ready!")

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

Logger.initialize(connection, `${__dirname}/tact-language-server.log`)

connection.listen()
