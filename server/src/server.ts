import {connection} from "./connection"
import {DocumentStore, getOffsetFromPosition} from "./document-store"
import {createTactParser, initParser} from "./parser"
import {asLspRange, asNullableLspRange, asParserPoint} from "@server/utils/position"
import {TypeInferer} from "./TypeInferer"
import {LocalSearchScope, Referent} from "@server/psi/Referent"
import {index, IndexKey} from "./indexes"
import {AsmInstr, CallLike, Expression, NamedNode, Node} from "@server/psi/Node"
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
import type {ClientOptions} from "@shared/config-scheme"
import {
    GetDocumentationAtPositionRequest,
    GetDocumentationAtPositionResponse,
    GetTypeAtPositionParams,
    GetTypeAtPositionRequest,
    GetTypeAtPositionResponse,
} from "@shared/shared-msgtypes"
import {KeywordsCompletionProvider} from "./completion/providers/KeywordsCompletionProvider"
import type {CompletionProvider} from "./completion/CompletionProvider"
import {SelfCompletionProvider} from "./completion/providers/SelfCompletionProvider"
import {ReturnCompletionProvider} from "./completion/providers/ReturnCompletionProvider"
import {BaseTy, FieldsOwnerTy} from "./types/BaseTy"
import type {PrepareRenameResult} from "vscode-languageserver-protocol/lib/common/protocol"
import {
    Constant,
    Contract,
    Field,
    Fun,
    InitFunction,
    Message,
    MessageFunction,
    Primitive,
    StorageMembersOwner,
    Struct,
    Trait,
} from "@server/psi/Decls"
import {ReferenceCompletionProvider} from "./completion/providers/ReferenceCompletionProvider"
import {OverrideCompletionProvider} from "./completion/providers/OverrideCompletionProvider"
import {TraitOrContractFieldsCompletionProvider} from "./completion/providers/TraitOrContractFieldsCompletionProvider"
import {TlbSerializationCompletionProvider} from "./completion/providers/TlbSerializationCompletionProvider"
import {MessageMethodCompletionProvider} from "./completion/providers/MessageMethodCompletionProvider"
import {MemberFunctionCompletionProvider} from "./completion/providers/MemberFunctionCompletionProvider"
import {TopLevelFunctionCompletionProvider} from "./completion/providers/TopLevelFunctionCompletionProvider"
import {measureTime, parentOfType} from "@server/psi/utils"
import {
    DidChangeWatchedFilesParams,
    FileChangeType,
    ParameterInformation,
    SymbolKind,
} from "vscode-languageserver"
import {Logger} from "@server/utils/logger"
import {MapTypeCompletionProvider} from "./completion/providers/MapTypeCompletionProvider"
import {UnusedParameterInspection} from "./inspections/UnusedParameterInspection"
import {EmptyBlockInspection} from "./inspections/EmptyBlockInspection"
import {UnusedVariableInspection} from "./inspections/UnusedVariableInspection"
import {CACHE} from "./cache"
import {
    findFile,
    findFiftFile,
    IndexRoot,
    IndexRootKind,
    PARSED_FILES_CACHE,
    FIFT_PARSED_FILES_CACHE,
} from "./index-root"
import {StructInitializationInspection} from "./inspections/StructInitializationInspection"
import {AsmInstructionCompletionProvider} from "./completion/providers/AsmInstructionCompletionProvider"
import {generateAsmDoc} from "./documentation/asm_documentation"
import {clearDocumentSettings, getDocumentSettings, TactSettings} from "@server/utils/settings"
import {ContractDeclCompletionProvider} from "./completion/providers/ContractDeclCompletionProvider"
import {collectFift} from "./fift/foldings/collect"
import {collectFift as collectFiftSemanticTokens} from "./fift/semantic_tokens/collect"
import {FiftReference} from "@server/fift/psi/FiftReference"
import {collectFift as collectFiftInlays} from "./fift/inlays/collect"
import {FiftReferent} from "@server/fift/psi/FiftReferent"
import {generateFiftDocFor} from "./fift/documentation/documentation"
import {UnusedContractMembersInspection} from "./inspections/UnusedContractMembersInspection"
import {generateKeywordDoc} from "@server/documentation/keywords_documentation"
import {UnusedImportInspection} from "./inspections/UnusedImportInspection"
import {ImportResolver} from "@server/psi/ImportResolver"
import {SnippetsCompletionProvider} from "@server/completion/providers/SnippetsCompletionProvider"
import {CompletionResult} from "@server/completion/WeightedCompletionItem"
import type {DocumentUri, TextEdit} from "vscode-languageserver-types"
import {MissedFieldInContractInspection} from "@server/inspections/MissedFieldInContractInspection"
import type {Node as SyntaxNode} from "web-tree-sitter"
import {TraitOrContractConstantsCompletionProvider} from "@server/completion/providers/TraitOrContractConstantsCompletionProvider"
import {generateTlBTypeDoc} from "@server/documentation/tlb_type_documentation"
import {BouncedTypeCompletionProvider} from "@server/completion/providers/BouncedTypeCompletionProvider"
import {TopLevelCompletionProvider} from "@server/completion/providers/TopLevelCompletionProvider"
import type {Intention, IntentionArguments, IntentionContext} from "@server/intentions/Intention"
import {AddExplicitType} from "@server/intentions/AddExplicitType"
import {AddImport} from "@server/intentions/AddImport"
import {NotImportedSymbolInspection} from "@server/inspections/NotImportedSymbolInspection"
import {FillAllStructInit, FillRequiredStructInit} from "@server/intentions/FillAllStructInit"
import {generateInitDoc, generateReceiverDoc} from "@server/documentation/receivers_documentation"
import {AsKeywordCompletionProvider} from "@server/completion/providers/AsKeywordCompletionProvider"
import {AddFieldInitialization} from "@server/intentions/AddFieldInitialization"
import {
    WrapSelectedToRepeat,
    WrapSelectedToTry,
    WrapSelectedToTryCatch,
} from "@server/intentions/WrapSelected"
import {PostfixCompletionProvider} from "@server/completion/providers/PostfixCompletionProvider"

/**
 * Whenever LS is initialized.
 *
 * @see initialize
 * @see initializeFallback
 */
let initialized = false

let clientInfo: {name?: string; version?: string} = {name: "", version: ""}

/**
 * Root folders for project.
 * Used to find files to index.
 */
let workspaceFolders: lsp.WorkspaceFolder[] | null = null

const showErrorMessage = (msg: string): void => {
    void connection.sendNotification(lsp.ShowMessageNotification.type, {
        type: lsp.MessageType.Error,
        message: msg,
    })
}

function findStdlib(settings: TactSettings, rootDir: string): string | null {
    if (settings.stdlib.path !== null && settings.stdlib.path.length > 0) {
        return settings.stdlib.path
    }

    const searchDirs = [
        "node_modules/@tact-lang/compiler/src/stdlib/stdlib",
        "node_modules/@tact-lang/compiler/src/stdlib",
        "node_modules/@tact-lang/compiler/stdlib",
        "stdlib",
    ]

    const localFolder =
        searchDirs.find(searchDir => {
            return existsSync(path.join(rootDir, searchDir))
        }) ?? null

    if (localFolder === null) {
        console.error(
            "Standard library not found! Searched in:\n",
            searchDirs.map(dir => path.join(rootDir, dir)).join("\n"),
        )

        showErrorMessage(
            "Tact standard library is missing! Try installing dependencies with `yarn/npm install` or specify `tact.stdlib.path` in settings",
        )
        return null
    }

    const stdlibPath = path.join(rootDir, localFolder)
    console.info(`Using Standard library from ${stdlibPath}`)
    return stdlibPath
}

async function initialize(): Promise<void> {
    if (!workspaceFolders || workspaceFolders.length === 0 || initialized) {
        // use fallback later, see `initializeFallback`
        return
    }

    const reporter = await connection.window.createWorkDoneProgress()

    reporter.begin("Tact Language Server", 0)

    const rootUri = workspaceFolders[0].uri
    const rootDir = rootUri.slice(7)

    const settings = await getDocumentSettings(rootUri)

    const stdlibPath = findStdlib(settings, rootDir)
    if (stdlibPath !== null) {
        reporter.report(50, "Indexing: (1/3) Standard Library")
        const stdlibRoot = new IndexRoot(`file://${stdlibPath}`, IndexRootKind.Stdlib)
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

    // Only run this in VS Code, as other editors may not handle these requests (like Helix)
    if (clientInfo.name?.includes("Code") || clientInfo.name?.includes("Codium")) {
        await connection.sendRequest(lsp.SemanticTokensRefreshRequest.type)
        await connection.sendRequest(lsp.InlayHintRefreshRequest.type)
    }
    CACHE.clear()

    reporter.done()

    initialized = true
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
connection.onInitialized(async () => {
    await initialize()
})

function findConfigFileDir(startPath: string, fileName: string): string | null {
    let currentPath = startPath

    // search only at depths up to 20
    for (let i = 0; i < 20; i++) {
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
async function initializeFallback(uri: string): Promise<void> {
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

connection.onInitialize(async (initParams: lsp.InitializeParams): Promise<lsp.InitializeResult> => {
    console.info("Started new session")
    console.info("Running in", initParams.clientInfo?.name)
    console.info("workspaceFolders:", initParams.workspaceFolders)

    if (initParams.clientInfo) {
        clientInfo = initParams.clientInfo
    }

    workspaceFolders = initParams.workspaceFolders ?? []
    const opts = initParams.initializationOptions as ClientOptions | undefined
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

        const file = findFile(uri)
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
        const file = findFile(uri, event.document.getText(), true)
        index.addFile(uri, file, false)

        const inspections = [
            new UnusedParameterInspection(),
            new EmptyBlockInspection(),
            new UnusedVariableInspection(),
            new StructInitializationInspection(),
            new UnusedContractMembersInspection(),
            new UnusedImportInspection(),
            new MissedFieldInContractInspection(),
            new NotImportedSymbolInspection(),
        ]

        const settings = await getDocumentSettings(uri)
        const diagnostics: lsp.Diagnostic[] = []

        for (const inspection of inspections) {
            if (settings.inspections.disabled.includes(inspection.id)) {
                continue
            }
            diagnostics.push(...inspection.inspect(file))
        }

        // const compilerInspection = new CompilerInspection()
        // diagnostics.push(...await compilerInspection.inspect(file))

        await connection.sendDiagnostics({uri, diagnostics})
    })

    connection.onDidChangeWatchedFiles((params: DidChangeWatchedFilesParams) => {
        for (const change of params.changes) {
            const uri = change.uri
            if (!uri.endsWith(".tact")) continue

            if (change.type === FileChangeType.Created) {
                console.info(`Find external create of ${uri}`)
                const file = findFile(uri)
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
                const file = findFile(uri, undefined, true)
                index.addFile(uri, file, false)
            }

            if (change.type === FileChangeType.Deleted) {
                console.info(`Find external delete of ${uri}`)
                index.removeFile(uri)
            }
        }
    })

    connection.onDidChangeConfiguration(() => {
        clearDocumentSettings()

        void connection.sendRequest(lsp.InlayHintRefreshRequest.type)
        void connection.sendRequest(lsp.CodeLensRefreshRequest.type)
    })

    function nodeAtPosition(params: lsp.TextDocumentPositionParams, file: File): SyntaxNode | null {
        const cursorPosition = asParserPoint(params.position)
        return file.rootNode.descendantForPosition(cursorPosition)
    }

    function provideDocumentation(uri: string, params: lsp.HoverParams): lsp.Hover | null {
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

        const file = findFile(params.textDocument.uri)
        const hoverNode = nodeAtPosition(params, file)
        if (!hoverNode) return null

        if (hoverNode.type === "initOf") {
            const doc = generateKeywordDoc("initOf")
            if (doc === null) return null

            return {
                range: asLspRange(hoverNode),
                contents: {
                    kind: "markdown",
                    value: doc,
                },
            }
        }

        if (hoverNode.type === "tvm_instruction") {
            const asmExpression = hoverNode.parent
            if (!asmExpression) return null

            const instr = new AsmInstr(asmExpression, file)
            const actualName = instr.info()?.mnemonic
            if (!actualName) return null

            const doc = generateAsmDoc(actualName)
            if (doc === null) return null

            return {
                range: asLspRange(hoverNode),
                contents: {
                    kind: "markdown",
                    value: doc,
                },
            }
        }

        const parent = hoverNode.parent
        if (parent?.type === "tlb_serialization") {
            const doc = generateTlBTypeDoc(hoverNode.text)
            if (doc === null) return null

            return {
                range: asLspRange(hoverNode),
                contents: {
                    kind: "markdown",
                    value: doc,
                },
            }
        }

        if (
            hoverNode.type === "receive" ||
            hoverNode.type === "external" ||
            hoverNode.type === "bounced"
        ) {
            const parent = hoverNode.parent
            if (!parent) return null
            const func = new MessageFunction(parent, file)
            const doc = generateReceiverDoc(func)
            if (doc === null) return null

            return {
                range: asLspRange(hoverNode),
                contents: {
                    kind: "markdown",
                    value: doc,
                },
            }
        }

        if (hoverNode.type === "init") {
            const parent = hoverNode.parent
            if (!parent) return null
            const func = new InitFunction(parent, file)
            const doc = generateInitDoc(func)
            if (doc === null) return null

            return {
                range: asLspRange(hoverNode),
                contents: {
                    kind: "markdown",
                    value: doc,
                },
            }
        }

        if (
            hoverNode.type !== "identifier" &&
            hoverNode.type !== "type_identifier" &&
            hoverNode.type !== "self"
        ) {
            return null
        }

        const res = Reference.resolve(NamedNode.create(hoverNode, file))
        if (res === null) {
            if (process.env["TACT_LS_DEV"] !== "true") {
                return null
            }

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
    }

    connection.onRequest(lsp.HoverRequest.type, (params: lsp.HoverParams): lsp.Hover | null => {
        const uri = params.textDocument.uri
        return provideDocumentation(uri, params)
    })

    connection.onRequest(
        lsp.DefinitionRequest.type,
        (params: lsp.DefinitionParams): lsp.Location[] | lsp.LocationLink[] => {
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

            const file = findFile(uri)
            const hoverNode = nodeAtPosition(params, file)
            if (!hoverNode) return []

            if (hoverNode.type === "string" && hoverNode.parent?.type === "import") {
                const importedFile = ImportResolver.resolveNode(file, hoverNode)
                if (!importedFile) return []

                const startOfFile = {
                    start: {line: 0, character: 0},
                    end: {line: 0, character: 0},
                }

                return [
                    {
                        targetUri: importedFile.uri,
                        targetRange: startOfFile,
                        targetSelectionRange: startOfFile,
                        originSelectionRange: asLspRange(hoverNode),
                    } as lsp.LocationLink,
                ]
            }

            // resolve `initOf Foo()`
            //          ^^^^^^ this
            // to `init` function of the contract or contract name
            if (hoverNode.type === "initOf") {
                const resolved = Reference.resolveInitOf(hoverNode, file)
                if (!resolved) return []

                return [
                    {
                        uri: resolved.file.uri,
                        range: asLspRange(resolved.node),
                    },
                ]
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
        (params: lsp.TypeDefinitionParams): lsp.Definition | lsp.DefinitionLink[] => {
            const uri = params.textDocument.uri
            const file = findFile(uri)
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
            const file = findFile(uri)
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
                (cursorNode.type !== "identifier" &&
                    cursorNode.type !== "type_identifier" &&
                    cursorNode.type !== "tvm_instruction")
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
                await getDocumentSettings(uri),
            )

            const result = new CompletionResult()
            const providers: CompletionProvider[] = [
                new SnippetsCompletionProvider(),
                new KeywordsCompletionProvider(),
                new AsKeywordCompletionProvider(),
                new MapTypeCompletionProvider(),
                new BouncedTypeCompletionProvider(),
                new ContractDeclCompletionProvider(),
                new TopLevelFunctionCompletionProvider(),
                new TopLevelCompletionProvider(),
                new MemberFunctionCompletionProvider(),
                new MessageMethodCompletionProvider(),
                new TlbSerializationCompletionProvider(),
                new OverrideCompletionProvider(),
                new TraitOrContractFieldsCompletionProvider(),
                new TraitOrContractConstantsCompletionProvider(),
                new SelfCompletionProvider(),
                new ReturnCompletionProvider(),
                new ReferenceCompletionProvider(ref),
                new AsmInstructionCompletionProvider(),
                new PostfixCompletionProvider(),
            ]

            providers.forEach((provider: CompletionProvider) => {
                if (!provider.isAvailable(ctx)) return
                provider.addCompletion(ctx, result)
            })

            return result.sorted()
        },
    )

    connection.languages.inlayHint.on(
        async (params: lsp.InlayHintParams): Promise<lsp.InlayHint[] | null> => {
            const uri = params.textDocument.uri
            if (uri.endsWith(".fif")) {
                const file = findFiftFile(uri)
                const settings = await getDocumentSettings(uri)
                return collectFiftInlays(file, settings.fift.hints)
            }

            const file = findFile(uri)
            const settings = await getDocumentSettings(uri)
            return inlays.collect(file, settings.hints)
        },
    )

    connection.onRequest(
        lsp.ImplementationRequest.type,
        (params: lsp.ImplementationParams): lsp.Definition | lsp.LocationLink[] => {
            const uri = params.textDocument.uri
            const file = findFile(uri)

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
                    range: asNullableLspRange(impl.nameIdentifier()),
                }))
            }

            if (res instanceof Fun) {
                return search.implementationsFun(res).map(impl => ({
                    uri: impl.file.uri,
                    range: asNullableLspRange(impl.nameIdentifier()),
                }))
            }

            return []
        },
    )

    connection.onRequest(lsp.RenameRequest.type, (params: lsp.RenameParams) => {
        const uri = params.textDocument.uri
        const file = findFile(uri)

        const renameNode = nodeAtPosition(params, file)
        if (!renameNode) return null

        const result = new Referent(renameNode, file).findReferences(true, false, false)
        if (result.length === 0) return null

        const changes: Record<DocumentUri, TextEdit[]> = {}

        result.forEach(node => {
            const uri = node.file.uri
            const element = {
                range: asLspRange(node.node),
                newText: params.newName,
            }

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (changes[uri]) {
                changes[uri].push(element)
            } else {
                changes[uri] = [element]
            }
        })

        return {changes}
    })

    connection.onRequest(
        lsp.PrepareRenameRequest.type,
        (params: lsp.PrepareRenameParams): PrepareRenameResult | null => {
            const uri = params.textDocument.uri
            const file = findFile(uri)

            const renameNode = nodeAtPosition(params, file)
            if (!renameNode) return null
            if (renameNode.type !== "identifier" && renameNode.type !== "type_identifier") {
                return null
            }

            const element = NamedNode.create(renameNode, file)
            const res = Reference.resolve(element)
            if (res === null) return null

            if (res.file.fromStdlib || res.file.fromStubs) {
                showErrorMessage(`Can not rename element from Standard Library`)
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
        (params: lsp.DocumentHighlightParams): lsp.DocumentHighlight[] | null => {
            const file = findFile(params.textDocument.uri)
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

            const usageKind = (value: Node): lsp.DocumentHighlightKind => {
                const parent = value.node.parent
                if (
                    parent?.type === "assignment_statement" ||
                    parent?.type === "augmented_assignment_statement"
                ) {
                    if (parent.childForFieldName("left")?.equals(value.node)) {
                        // left = 10
                        // ^^^^
                        return lsp.DocumentHighlightKind.Write
                    }
                }

                return lsp.DocumentHighlightKind.Read
            }

            return result.map(value => ({
                range: asLspRange(value.node),
                kind: usageKind(value),
            }))
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

            const file = findFile(uri)
            const referenceNode = nodeAtPosition(params, file)
            if (!referenceNode) return null

            if (
                referenceNode.type !== "identifier" &&
                referenceNode.type !== "type_identifier" &&
                referenceNode.type !== "init"
            ) {
                return []
            }

            const result = new Referent(referenceNode, file).findReferences(false)
            if (result.length === 0) return null

            const settings = await getDocumentSettings(file.uri)
            if (settings.findUsages.scope === "workspace") {
                // filter out references from stdlib
                return result
                    .filter(value => !value.file.fromStdlib && !value.file.fromStubs)
                    .map(value => ({
                        uri: value.file.uri,
                        range: asLspRange(value.node),
                    }))
            }

            return result.map(value => ({
                uri: value.file.uri,
                range: asLspRange(value.node),
            }))
        },
    )

    const findSignatureHelpTarget = (
        hoverNode: SyntaxNode,
        file: File,
    ): {
        rawArguments: SyntaxNode[]
        parametersInfo: lsp.ParameterInformation[]
        presentation: string
        isMethod: boolean
        isStructField: boolean
        structFieldIndex: number
    } | null => {
        const findParametersNode = (element: NamedNode): SyntaxNode | null => {
            if (element instanceof Contract) {
                return element.initFunction()?.node.childForFieldName("parameters") ?? null
            }

            return element.node.childForFieldName("parameters")
        }

        const callNode = parentOfType(
            hoverNode,
            "static_call_expression",
            "method_call_expression",
            "initOf",
            "instance_expression",
            "instance_argument",
            "instance_argument_list",
        )
        if (!callNode) return null

        if (callNode.type === "instance_expression") return null // don't show any signature helps

        if (callNode.type === "instance_argument_list" || callNode.type === "instance_argument") {
            let name =
                callNode.childForFieldName("name") ??
                (hoverNode.type === "instance_argument"
                    ? hoverNode.firstChild
                    : hoverNode.previousNamedSibling)

            if (!name) return null
            if (name.type === "instance_argument") {
                name = name.firstChild
            }
            if (!name) return null

            const type = new Expression(name, file).type()
            if (!type) return null

            const instanceExpression = parentOfType(callNode, "instance_expression")
            if (!instanceExpression) return null

            const instanceName = instanceExpression.childForFieldName("name")
            if (!instanceName) return null

            const instanceType = new Expression(instanceName, file).type()
            if (!instanceType) return null
            if (!(instanceType instanceof FieldsOwnerTy)) return null

            const fields = instanceType.fields()
            const fieldPresentations = fields.map(
                field => `${field.name()}: ${field.typeNode()?.node.text ?? ""}`,
            )

            const fieldsInfo = fieldPresentations.map(
                name =>
                    ({
                        label: name,
                    }) as ParameterInformation,
            )

            const presentation = instanceType.name() + "{ " + fieldPresentations.join(", ") + " }"

            return {
                rawArguments: [],
                parametersInfo: fieldsInfo,
                presentation: presentation,
                isMethod: false,
                isStructField: true,
                structFieldIndex: fields.findIndex(f => f.name() === name.text),
            }
        }

        const call = new CallLike(callNode, file)

        const res = Reference.resolve(call.nameNode())
        if (res === null) return null

        const parametersNode = findParametersNode(res)
        if (!parametersNode) return null

        const parameters = parametersNode.children
            .filter(value => value?.type === "parameter")
            .filter(value => value !== null)

        const rawArguments = call.rawArguments()

        const parametersInfo: lsp.ParameterInformation[] = parameters.map(value => ({
            label: value.text,
        }))
        const parametersString = parametersInfo.map(el => el.label).join(", ")

        if (callNode.type === "initOf") {
            return {
                rawArguments,
                parametersInfo,
                presentation: `init(${parametersString})`,
                isMethod: false,
                isStructField: false,
                structFieldIndex: 0,
            }
        }

        if (!(res instanceof Fun)) return null

        return {
            rawArguments,
            parametersInfo,
            presentation: `fun ${call.name()}(${parametersString})`,
            isMethod: callNode.type === "method_call_expression" && res.withSelf(),
            isStructField: false,
            structFieldIndex: 0,
        }
    }

    connection.onRequest(
        lsp.SignatureHelpRequest.type,
        (params: lsp.SignatureHelpParams): lsp.SignatureHelp | null => {
            const file = findFile(params.textDocument.uri)

            const hoverNode = nodeAtPosition(params, file)
            if (!hoverNode) return null

            const res = findSignatureHelpTarget(hoverNode, file)
            if (!res) return null

            const {
                parametersInfo,
                rawArguments,
                isMethod,
                presentation,
                isStructField,
                structFieldIndex,
            } = res

            if (isStructField) {
                return {
                    signatures: [
                        {
                            label: presentation,
                            parameters: parametersInfo,
                            activeParameter: structFieldIndex,
                        },
                    ],
                }
            }

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

            if (isMethod) {
                // skip self
                currentIndex++
            }

            return {
                signatures: [
                    {
                        label: presentation,
                        parameters: parametersInfo,
                        activeParameter: currentIndex,
                    },
                ],
            }
        },
    )

    connection.onRequest(
        lsp.FoldingRangeRequest.type,
        (params: lsp.FoldingRangeParams): lsp.FoldingRange[] => {
            const uri = params.textDocument.uri
            if (uri.endsWith(".fif")) {
                const file = findFiftFile(uri)
                return collectFift(file)
            }

            const file = findFile(uri)
            return measureTime("folding range", () => foldings.collect(file))
        },
    )

    connection.onRequest(
        lsp.SemanticTokensRequest.type,
        async (params: lsp.SemanticTokensParams): Promise<lsp.SemanticTokens | null> => {
            const uri = params.textDocument.uri
            if (uri.endsWith(".fif")) {
                const file = findFiftFile(uri)
                const settings = await getDocumentSettings(uri)
                return collectFiftSemanticTokens(file, settings.fift.semanticHighlighting)
            }

            const file = findFile(uri)
            return semantic.collect(file)
        },
    )

    connection.onRequest(
        lsp.CodeLensRequest.type,
        async (params: lsp.CodeLensParams): Promise<lsp.CodeLens[]> => {
            const uri = params.textDocument.uri
            const file = findFile(uri)
            const settings = await getDocumentSettings(uri)
            return lens.collect(file, settings.codeLens)
        },
    )

    const intentions: Intention[] = [
        new AddExplicitType(),
        new AddImport(),
        new FillAllStructInit(),
        new FillRequiredStructInit(),
        new AddFieldInitialization(),
        new WrapSelectedToTry(),
        new WrapSelectedToTryCatch(),
        new WrapSelectedToRepeat(),
    ]

    connection.onRequest(
        lsp.ExecuteCommandRequest.type,
        async (params: lsp.ExecuteCommandParams) => {
            if (params.command === "tact/executeGetScopeProvider") {
                const commandParams = params.arguments?.[0] as
                    | lsp.TextDocumentPositionParams
                    | undefined
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
            }

            if (!params.arguments || params.arguments.length === 0) return null

            const intention = intentions.find(it => it.id === params.command)
            if (!intention) return null

            const args = params.arguments[0] as IntentionArguments

            const file = findFile(args.fileUri)

            const ctx: IntentionContext = {
                file: file,
                range: args.range,
                position: args.position,
                noSelection:
                    args.range.start.line === args.range.end.line &&
                    args.range.start.character === args.range.end.character,
            }

            const edits = intention.invoke(ctx)
            if (!edits) return null

            await connection.sendRequest(lsp.ApplyWorkspaceEditRequest.method, {
                label: `Intention "${intention.name}"`,
                edit: edits,
            } as lsp.ApplyWorkspaceEditParams)

            return null
        },
    )

    connection.onRequest(
        lsp.CodeActionRequest.type,
        (params: lsp.CodeActionParams): lsp.CodeAction[] | null => {
            const uri = params.textDocument.uri
            if (uri.endsWith(".fif")) {
                return null
            }

            const file = findFile(uri)

            const ctx: IntentionContext = {
                file: file,
                range: params.range,
                position: params.range.start,
                noSelection:
                    params.range.start.line === params.range.end.line &&
                    params.range.start.character === params.range.end.character,
            }

            const actions: lsp.CodeAction[] = []

            intentions.forEach(intention => {
                if (!intention.isAvailable(ctx)) return

                actions.push({
                    title: intention.name,
                    kind: lsp.CodeActionKind.QuickFix,
                    command: {
                        title: intention.name,
                        command: intention.id,
                        arguments: [
                            {
                                fileUri: file.uri,
                                range: params.range,
                                position: params.range.start,
                            } as IntentionArguments,
                        ],
                    },
                })
            })

            return actions
        },
    )

    connection.onRequest(
        GetTypeAtPositionRequest,
        (params: GetTypeAtPositionParams): GetTypeAtPositionResponse => {
            const file = findFile(params.textDocument.uri)
            const cursorPosition = asParserPoint(params.position)

            const node = file.rootNode.descendantForPosition(cursorPosition)
            if (!node) {
                return {type: null}
            }

            const adjustedNode = node.parent?.type === "method_call_expression" ? node.parent : node

            const type = TypeInferer.inferType(new Expression(adjustedNode, file))
            return {
                type: type ? type.qualifiedName() : null,
            }
        },
    )

    connection.onRequest(
        GetDocumentationAtPositionRequest,
        (params: GetTypeAtPositionParams): GetDocumentationAtPositionResponse | null => {
            const uri = params.textDocument.uri
            return provideDocumentation(uri, params)
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
        if (node instanceof Field) {
            return lsp.SymbolKind.Field
        }
        return lsp.SymbolKind.Object
    }

    connection.onRequest(
        lsp.DocumentSymbolRequest.type,
        async (params: lsp.DocumentSymbolParams): Promise<lsp.DocumentSymbol[]> => {
            const uri = params.textDocument.uri
            const file = findFile(uri)

            const settings = await getDocumentSettings(file.uri)

            const result: lsp.DocumentSymbol[] = []

            function symbolDetail(element: NamedNode | Fun | Field | Constant): string {
                if (element instanceof Fun) {
                    return element.signaturePresentation()
                }
                if (element instanceof Field) {
                    const type = element.typeNode()?.node.text ?? "unknown"
                    return `: ${type}`
                }
                if (element instanceof Constant) {
                    const type = element.typeNode()?.node.text ?? "unknown"
                    const value = element.value()?.node.text ?? "unknown"
                    return `: ${type} = ${value}`
                }
                return ""
            }

            function createSymbol(element: NamedNode): lsp.DocumentSymbol {
                const detail = symbolDetail(element)
                const kind = symbolKind(element)
                const children = symbolChildren(element)

                return {
                    name: element.name(),
                    kind: kind,
                    range: asNullableLspRange(element.nameIdentifier()),
                    detail: detail,
                    selectionRange: asNullableLspRange(element.nameIdentifier()),
                    children: children,
                }
            }

            function addMessageFunctions(
                element: StorageMembersOwner,
                to: lsp.DocumentSymbol[],
            ): void {
                const messageFunctions = element.messageFunctions()
                messageFunctions.forEach(messageFunction => {
                    to.push({
                        name: messageFunction.nameLike(),
                        range: asNullableLspRange(messageFunction.node),
                        selectionRange: asNullableLspRange(messageFunction.kindIdentifier()),
                        kind: SymbolKind.Method,
                    })
                })
            }

            function symbolChildren(element: NamedNode): lsp.DocumentSymbol[] {
                const children: NamedNode[] = []
                const additionalChildren: lsp.DocumentSymbol[] = []

                if (element instanceof Struct && settings.documentSymbols.showStructFields) {
                    children.push(...element.fields())
                }

                if (element instanceof Message && settings.documentSymbols.showMessageFields) {
                    children.push(...element.fields())
                }

                if (element instanceof Contract) {
                    children.push(
                        ...element.ownConstants(),
                        ...element.ownFields(),
                        ...element.ownMethods(),
                    )

                    const initFunction = element.initFunction()
                    if (initFunction) {
                        additionalChildren.push({
                            name: initFunction.nameLike(),
                            range: asNullableLspRange(initFunction.node),
                            selectionRange: asNullableLspRange(initFunction.initIdentifier()),
                            kind: SymbolKind.Constructor,
                        })
                    }

                    addMessageFunctions(element, additionalChildren)
                }

                if (element instanceof Trait) {
                    children.push(
                        ...element.ownConstants(),
                        ...element.ownFields(),
                        ...element.ownMethods(),
                    )

                    addMessageFunctions(element, additionalChildren)
                }

                return [...children.map(el => createSymbol(el)), ...additionalChildren]
            }

            file.imports().forEach(imp => {
                result.push({
                    name: imp.text,
                    range: asLspRange(imp),
                    selectionRange: asLspRange(imp),
                    kind: SymbolKind.Module,
                })
            })

            file.getFuns().forEach(n => result.push(createSymbol(n)))
            file.getStructs().forEach(n => result.push(createSymbol(n)))
            file.getMessages().forEach(n => result.push(createSymbol(n)))
            file.getTraits().forEach(n => result.push(createSymbol(n)))
            file.getConstants().forEach(n => result.push(createSymbol(n)))
            file.getContracts().forEach(n => result.push(createSymbol(n)))
            file.getPrimitives().forEach(n => result.push(createSymbol(n)))

            return result.sort((a, b) => a.range.start.line - b.range.start.line)
        },
    )

    connection.onRequest(
        lsp.WorkspaceSymbolRequest.type,
        (_params: lsp.WorkspaceSymbolParams): lsp.WorkspaceSymbol[] => {
            const result: lsp.WorkspaceSymbol[] = []

            const state = new ResolveState()
            const proc = new (class implements ScopeProcessor {
                public execute(node: Node, _state: ResolveState): boolean {
                    if (!(node instanceof NamedNode)) return true
                    const nameIdentifier = node.nameIdentifier()
                    if (!nameIdentifier) return true

                    result.push({
                        name: node.name(),
                        containerName: "",
                        kind: symbolKind(node),
                        location: {
                            uri: node.file.uri,
                            range: asLspRange(nameIdentifier),
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

    // eslint-disable-next-line @typescript-eslint/unbound-method
    const _needed = TypeInferer.inferType

    console.info("Tact language server is ready!")

    return {
        capabilities: {
            textDocumentSync: lsp.TextDocumentSyncKind.Incremental,
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
            codeActionProvider: {
                codeActionKinds: [lsp.CodeActionKind.QuickFix],
            },
            executeCommandProvider: {
                commands: ["tact/executeGetScopeProvider", ...intentions.map(it => it.id)],
            },
        },
    }
})

Logger.initialize(connection, `${__dirname}/tact-language-server.log`)

connection.listen()
