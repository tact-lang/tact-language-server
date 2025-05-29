//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import {connection} from "./connection"
import {DocumentStore} from "./document-store"
import {initParser} from "./parser"
import {asParserPoint} from "@server/utils/position"
import {TypeInferer} from "./languages/tact/TypeInferer"
import {index, IndexRoot} from "@server/languages/tact/indexes"
import * as lsp from "vscode-languageserver"
import {DidChangeWatchedFilesParams, FileChangeType} from "vscode-languageserver"
import {TypeBasedSearch} from "@server/languages/tact/search/TypeBasedSearch"
import * as path from "node:path"
import {existsSync} from "node:fs"
import type {ClientOptions} from "@shared/config-scheme"
import {
    DocumentationAtPositionRequest,
    GasConsumptionForSelectionRequest,
    TypeAtPositionParams,
    TypeAtPositionRequest,
    TypeAtPositionResponse,
    SearchByTypeParams,
    SearchByTypeRequest,
    SearchByTypeResponse,
    SetToolchainVersionNotification,
    SetToolchainVersionParams,
} from "@shared/shared-msgtypes"
import {Logger} from "@server/utils/logger"
import {CACHE} from "./languages/tact/cache"
import {IndexingRoot, IndexingRootKind} from "./indexing-root"
import {clearDocumentSettings, getDocumentSettings, TactSettings} from "@server/settings/settings"
import {provideFiftFoldingRanges} from "@server/languages/fift/foldings/collect"
import {provideFiftSemanticTokens as provideFiftSemanticTokens} from "server/src/languages/fift/semantic-tokens"
import {collectFift as collectFiftInlays} from "@server/languages/fift/inlays/collect"
import {WorkspaceEdit} from "vscode-languageserver-types"
import type {Node as SyntaxNode} from "web-tree-sitter"
import {
    InvalidToolchainError,
    setProjectStdlibPath,
} from "@server/languages/tact/toolchain/toolchain"
import {setToolchain, setWorkspaceRoot, toolchain} from "@server/toolchain"
import * as toolchainManager from "@server/toolchain-manager"
import {formatCode} from "@server/languages/tact/compiler/fmt/fmt"
import {fileURLToPath} from "node:url"
import {onFileRenamed, processFileRenaming} from "@server/languages/tact/rename/file-renaming"
import {provideSelectionGasConsumption} from "@server/languages/tact/custom/selection-gas-consumption"
import {runInspections} from "@server/languages/tact/inspections"
import {
    FIFT_PARSED_FILES_CACHE,
    filePathToUri,
    findFiftFile,
    findTactFile,
    findTlbFile,
    isFiftFile,
    isTactFile,
    isTlbFile,
    PARSED_FILES_CACHE,
    reparseFiftFile,
    reparseTactFile,
    reparseTlbFile,
    TLB_PARSED_FILES_CACHE,
} from "@server/files"
import {provideTactDocumentation} from "@server/languages/tact/documentation"
import {provideFiftDocumentation} from "@server/languages/fift/documentation"
import {
    provideTactDefinition,
    provideTactTypeDefinition,
} from "@server/languages/tact/find-definitions"
import {provideTlbDefinition} from "@server/languages/tlb/find-definitions"
import {provideFiftDefinition} from "@server/languages/fift/find-definitions"
import {File} from "@server/psi/File"
import {
    provideTactCompletion,
    provideTactCompletionResolve,
} from "@server/languages/tact/completion"
import {provideTactSignatureInfo} from "@server/languages/tact/signature-help"
import {provideTactRename, provideTactRenamePrepare} from "@server/languages/tact/rename"
import {
    provideTactDocumentSymbols,
    provideTactWorkspaceSymbols,
} from "@server/languages/tact/symbols"
import {
    INTENTIONS,
    provideExecuteTactCommand,
    provideTactCodeActions,
} from "@server/languages/tact/intentions"
import {provideFiftReferences} from "@server/languages/fift/references"
import {provideTactReferences} from "@server/languages/tact/references"
import {provideTactFoldingRanges} from "@server/languages/tact/foldings"
import {provideTactSemanticTokens} from "@server/languages/tact/semantic-tokens"
import {provideTlbSemanticTokens} from "@server/languages/tlb/semantic-tokens"
import {collectTactCodeLenses} from "@server/languages/tact/lens"
import {collectTactInlays} from "@server/languages/tact/inlays"
import {provideTactDocumentHighlight} from "@server/languages/tact/highlighting"
import {provideTactImplementations} from "@server/languages/tact/implementations"
import {provideTactTypeAtPosition} from "@server/languages/tact/custom/type-at-position"
import {provideTlbDocumentSymbols} from "@server/languages/tlb/symbols"
import {provideTlbCompletion} from "@server/languages/tlb/completion"
import {TLB_CACHE} from "@server/languages/tlb/cache"
import {provideTlbReferences} from "@server/languages/tlb/references"
import {TextDocument} from "vscode-languageserver-textdocument"

interface PendingFileEvent {
    readonly uri: string
    readonly content?: string
    readonly textDocumentEvent: lsp.TextDocumentChangeEvent<TextDocument>
}

/**
 * Whenever LS is initialized.
 *
 * @see initialize
 * @see initializeFallback
 */
let initialized = false
let initializationFinished = false

let pendingFileEvents: PendingFileEvent[] = []
let clientInfo: {name?: string; version?: string} = {name: "", version: ""}

/**
 * Root folders for a project.
 * Used to find files to index.
 */
let workspaceFolders: lsp.WorkspaceFolder[] | null = null

async function processPendingEvents(): Promise<void> {
    console.info(`Processing ${pendingFileEvents.length} pending file events`)

    for (const event of pendingFileEvents) {
        await handleFileOpen(event.textDocumentEvent, true)
    }

    pendingFileEvents = []
}

async function handleFileOpen(
    event: lsp.TextDocumentChangeEvent<TextDocument>,
    skipQueue: boolean,
): Promise<void> {
    const uri = event.document.uri

    if (!skipQueue && !initializationFinished) {
        pendingFileEvents.push({
            uri,
            textDocumentEvent: event,
        })
        return
    }

    if (isFiftFile(uri, event)) {
        findFiftFile(uri)
    }

    if (isTlbFile(uri, event)) {
        findTlbFile(uri)
    }

    if (isTactFile(uri, event)) {
        const file = findTactFile(uri)
        index.addFile(uri, file)

        if (initializationFinished) {
            await runInspections(uri, file, true)
        }
    }
}

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

    if (process.env["TACT_LS_SKIP_STDLIB_IN_TESTS"] === "true") {
        return null
    }

    const searchDirs = [
        "node_modules/@tact-lang/compiler/src/stdlib/stdlib",
        "node_modules/@tact-lang/compiler/src/stdlib",
        "node_modules/@tact-lang/compiler/stdlib",
        "node_modules/@tact-lang/compiler/dist/src/stdlib/stdlib",
        "node_modules/@tact-lang/compiler/dist/stdlib/stdlib",
        "node_modules/@tact-lang/compiler/dist/src/stdlib",
        "node_modules/@tact-lang/compiler/dist/stdlib",
        "src/stdlib/stdlib", // path in compiler repo
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

function findStubs(): string | null {
    if (process.env["TACT_LS_SKIP_STDLIB_IN_TESTS"] === "true") {
        return null
    }

    return path.join(__dirname, "stubs")
}

async function initialize(): Promise<void> {
    if (!workspaceFolders || workspaceFolders.length === 0 || initialized) {
        // use fallback later, see `initializeFallback`
        return
    }
    initialized = true

    const reporter = await connection.window.createWorkDoneProgress()

    reporter.begin("Tact Language Server", 0)

    const rootUri = workspaceFolders[0].uri
    const rootDir = fileURLToPath(rootUri)

    setWorkspaceRoot(rootDir)

    const settings = await getDocumentSettings(rootUri)

    try {
        toolchainManager.setWorkspaceRoot(rootDir)
        toolchainManager.setToolchains(
            settings.toolchain.toolchains,
            settings.toolchain.activeToolchain,
        )

        const activeToolchain = toolchainManager.getActiveToolchain()
        if (activeToolchain) {
            setToolchain(activeToolchain)
            console.info(
                `using toolchain ${toolchain.toString()} (${toolchainManager.getActiveToolchainId()})`,
            )

            await connection.sendNotification(SetToolchainVersionNotification, {
                version: toolchain.version,
                toolchain: toolchain.getToolchainInfo(),
                environment: toolchain.getEnvironmentInfo(),
            } satisfies SetToolchainVersionParams)
        } else {
            console.warn(`No active toolchain found for ${settings.toolchain.activeToolchain}`)
        }
    } catch (error) {
        if (error instanceof InvalidToolchainError) {
            console.info(`toolchain is invalid ${error.message}`)
            showErrorMessage(error.message)
        }
    }

    const stdlibPath = findStdlib(settings, rootDir)
    if (stdlibPath !== null) {
        reporter.report(50, "Indexing: (1/3) Standard Library")
        const stdlibUri = filePathToUri(stdlibPath)
        index.withStdlibRoot(new IndexRoot("stdlib", stdlibUri))

        const stdlibRoot = new IndexingRoot(stdlibUri, IndexingRootKind.Stdlib)
        stdlibRoot.index()
    }

    setProjectStdlibPath(stdlibPath)

    reporter.report(55, "Indexing: (2/3) Stubs")
    const stubsPath = findStubs()
    if (stubsPath !== null) {
        const stubsUri = filePathToUri(stubsPath)
        index.withStubsRoot(new IndexRoot("stubs", stubsUri))

        const stubsRoot = new IndexingRoot(stubsUri, IndexingRootKind.Stdlib)
        stubsRoot.index()
    }

    reporter.report(80, "Indexing: (3/3) Workspace")
    index.withRoots([new IndexRoot("workspace", rootUri)])
    const workspaceRoot = new IndexingRoot(rootUri, IndexingRootKind.Workspace)
    workspaceRoot.index()

    reporter.report(100, "Ready")

    CACHE.clear()
    TLB_CACHE.clear()

    // When we are ready, just reload all applied highlighting and hints and clear cache
    // This way we support fast local resolving and then full resolving after indexing.

    // Only run this in VS Code, as other editors may not handle these requests (like Helix)
    if (clientInfo.name?.includes("Code") || clientInfo.name?.includes("Codium")) {
        await connection.sendRequest(lsp.SemanticTokensRefreshRequest.type)
        await connection.sendRequest(lsp.InlayHintRefreshRequest.type)
    }

    reporter.done()
    initializationFinished = true

    await processPendingEvents()
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

// For some reason, some editors (like Neovim) don't pass workspace folders to initialization.
// So we need to find root first and then call `initialize`.
async function initializeFallback(uri: string): Promise<void> {
    // let's try to initialize with this way
    const filepath = fileURLToPath(uri)
    const projectDir = findConfigFileDir(path.dirname(filepath), "tact.config.json")
    if (projectDir === null) {
        console.info(`project directory not found, using file directory`)
        const dir = path.dirname(filepath)
        workspaceFolders = [
            {
                uri: filePathToUri(dir),
                name: path.basename(dir),
            },
        ]
        await initialize()
        return
    }

    console.info(`found project directory: ${projectDir}`)
    workspaceFolders = [
        {
            uri: filePathToUri(projectDir),
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
    const tlbLangUri = opts?.tlbLangWasmUri ?? `${__dirname}/tree-sitter-tlb.wasm`
    await initParser(treeSitterUri, tactLangUri, fiftLangUri, tlbLangUri)

    const documents = new DocumentStore(connection)

    documents.onDidOpen(async event => {
        const uri = event.document.uri
        console.info("open:", uri)

        if (!initialized) {
            await initializeFallback(uri)
        }

        await handleFileOpen(event, false)
    })

    documents.onDidChangeContent(async event => {
        if (event.document.version === 1) {
            return
        }

        const uri = event.document.uri
        console.info("changed:", uri)

        if (isFiftFile(uri, event)) {
            FIFT_PARSED_FILES_CACHE.delete(uri)
            reparseFiftFile(uri, event.document.getText())
        }

        if (isTlbFile(uri, event)) {
            TLB_PARSED_FILES_CACHE.delete(uri)
            TLB_CACHE.clear()
            reparseTlbFile(uri, event.document.getText())
        }

        if (isTactFile(uri, event)) {
            index.fileChanged(uri)
            const file = reparseTactFile(uri, event.document.getText())
            index.addFile(uri, file, false)

            if (initializationFinished) {
                await runInspections(uri, file, false) // linters require saved files, see onDidSave
            }
        }
    })

    documents.onDidSave(async event => {
        const uri = event.document.uri
        if (isTactFile(uri, event)) {
            if (initializationFinished) {
                const file = findTactFile(uri)
                await runInspections(uri, file, true)
            }
        }
    })

    connection.onDidChangeWatchedFiles((params: DidChangeWatchedFilesParams) => {
        for (const change of params.changes) {
            const uri = change.uri
            if (!isTactFile(uri)) continue

            if (change.type === FileChangeType.Created) {
                console.info(`Find external create of ${uri}`)
                const file = findTactFile(uri)
                index.addFile(uri, file)
                continue
            }

            if (!PARSED_FILES_CACHE.has(uri)) {
                // we don't care about non-parsed files
                continue
            }

            if (change.type === FileChangeType.Changed) {
                console.info(`Find external change of ${uri}`)
                index.fileChanged(uri)
                const file = findTactFile(uri, true)
                index.addFile(uri, file, false)
            }

            if (change.type === FileChangeType.Deleted) {
                console.info(`Find external delete of ${uri}`)
                index.removeFile(uri)
            }
        }
    })

    connection.onRequest("workspace/willRenameFiles", processFileRenaming)
    connection.onNotification("workspace/didRenameFiles", onFileRenamed)

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    connection.onDidChangeConfiguration(async () => {
        clearDocumentSettings()

        if (workspaceFolders && workspaceFolders.length > 0) {
            const rootUri = workspaceFolders[0].uri
            const newSettings = await getDocumentSettings(rootUri)

            if (newSettings.toolchain.activeToolchain !== toolchainManager.getActiveToolchainId()) {
                try {
                    toolchainManager.setToolchains(
                        newSettings.toolchain.toolchains,
                        newSettings.toolchain.activeToolchain,
                    )

                    const activeToolchain = toolchainManager.getActiveToolchain()
                    if (activeToolchain) {
                        setToolchain(activeToolchain)
                        console.info(
                            `switched to toolchain ${toolchain.toString()} (${toolchainManager.getActiveToolchainId()})`,
                        )

                        await connection.sendNotification(SetToolchainVersionNotification, {
                            version: toolchain.version,
                            toolchain: toolchain.getToolchainInfo(),
                            environment: toolchain.getEnvironmentInfo(),
                        } satisfies SetToolchainVersionParams)
                    }
                } catch (error) {
                    if (error instanceof InvalidToolchainError) {
                        console.error(`Failed to switch toolchain: ${error.message}`)
                        showErrorMessage(`Failed to switch toolchain: ${error.message}`)
                    }
                }
            }
        }

        void connection.sendRequest(lsp.InlayHintRefreshRequest.type)
        void connection.sendRequest(lsp.CodeLensRefreshRequest.type)
    })

    function nodeAtPosition(params: lsp.TextDocumentPositionParams, file: File): SyntaxNode | null {
        const cursorPosition = asParserPoint(params.position)
        return file.rootNode.descendantForPosition(cursorPosition)
    }

    async function provideDocumentation(params: lsp.HoverParams): Promise<lsp.Hover | null> {
        const uri = params.textDocument.uri

        if (isFiftFile(uri)) {
            const file = findFiftFile(uri)
            const hoverNode = nodeAtPosition(params, file)
            if (!hoverNode) return null
            return provideFiftDocumentation(hoverNode, file)
        }

        if (isTactFile(uri)) {
            const file = findTactFile(params.textDocument.uri)
            const hoverNode = nodeAtPosition(params, file)
            if (!hoverNode) return null
            return provideTactDocumentation(params, hoverNode, file)
        }

        return null
    }

    connection.onRequest(lsp.HoverRequest.type, provideDocumentation)

    connection.onRequest(
        lsp.DefinitionRequest.type,
        (params: lsp.DefinitionParams): lsp.Location[] | lsp.LocationLink[] => {
            const uri = params.textDocument.uri

            if (isFiftFile(uri)) {
                const file = findFiftFile(uri)
                const node = nodeAtPosition(params, file)
                if (!node || node.type !== "identifier") return []

                return provideFiftDefinition(node, file)
            }

            if (isTlbFile(uri)) {
                const file = findTlbFile(uri)
                const hoverNode = nodeAtPosition(params, file)
                if (!hoverNode) return []

                return provideTlbDefinition(hoverNode, file)
            }

            if (isTactFile(uri)) {
                const file = findTactFile(uri)
                const hoverNode = nodeAtPosition(params, file)
                if (!hoverNode) return []

                return provideTactDefinition(hoverNode, file)
            }

            return []
        },
    )

    connection.onRequest(
        lsp.TypeDefinitionRequest.type,
        (params: lsp.TypeDefinitionParams): lsp.Definition | lsp.DefinitionLink[] => {
            const uri = params.textDocument.uri

            if (isTactFile(uri)) {
                const file = findTactFile(uri)
                const hoverNode = nodeAtPosition(params, file)
                if (!hoverNode) return []

                return provideTactTypeDefinition(hoverNode, file)
            }

            return []
        },
    )

    connection.onRequest(lsp.CompletionResolveRequest.type, provideTactCompletionResolve)
    connection.onRequest(
        lsp.CompletionRequest.type,
        async (params: lsp.CompletionParams): Promise<lsp.CompletionItem[]> => {
            const uri = params.textDocument.uri

            if (isTactFile(uri)) {
                const file = findTactFile(uri)
                return provideTactCompletion(file, params, uri)
            }

            if (isTlbFile(uri)) {
                const file = findTlbFile(uri)
                return provideTlbCompletion(file, params, uri)
            }

            return []
        },
    )

    connection.onRequest(
        lsp.InlayHintRequest.type,
        async (params: lsp.InlayHintParams): Promise<lsp.InlayHint[] | null> => {
            const uri = params.textDocument.uri
            const settings = await getDocumentSettings(uri)
            if (settings.hints.disable || !initializationFinished) {
                return null
            }

            if (isFiftFile(uri)) {
                const file = findFiftFile(uri)
                return collectFiftInlays(file, settings.hints.gasFormat, settings.fift.hints)
            }

            if (isTactFile(uri)) {
                const file = findTactFile(uri)
                return collectTactInlays(file, settings.hints, settings.gas)
            }

            return null
        },
    )

    connection.onRequest(
        lsp.ImplementationRequest.type,
        (params: lsp.ImplementationParams): lsp.Definition | lsp.LocationLink[] | null => {
            const uri = params.textDocument.uri

            if (isTactFile(uri)) {
                const file = findTactFile(uri)
                const elementNode = nodeAtPosition(params, file)
                if (!elementNode) return []
                return provideTactImplementations(elementNode, file)
            }

            return null
        },
    )

    connection.onRequest(
        lsp.RenameRequest.type,
        (params: lsp.RenameParams): WorkspaceEdit | null => {
            const uri = params.textDocument.uri

            if (isTactFile(uri)) {
                const file = findTactFile(uri)
                return provideTactRename(params, file)
            }

            return null
        },
    )

    connection.onRequest(
        lsp.PrepareRenameRequest.type,
        (params: lsp.PrepareRenameParams): lsp.PrepareRenameResult | null => {
            const uri = params.textDocument.uri

            if (isTactFile(uri)) {
                const file = findTactFile(uri)

                const result = provideTactRenamePrepare(params, file)
                if (typeof result === "string") {
                    showErrorMessage(result)
                    return null
                }

                return result
            }

            return null
        },
    )

    connection.onRequest(
        lsp.DocumentHighlightRequest.type,
        (params: lsp.DocumentHighlightParams): lsp.DocumentHighlight[] | null => {
            const uri = params.textDocument.uri

            if (isTactFile(uri)) {
                const file = findTactFile(uri)
                const node = nodeAtPosition(params, file)
                if (!node) return null
                return provideTactDocumentHighlight(node, file)
            }

            return null
        },
    )

    connection.onRequest(
        lsp.ReferencesRequest.type,
        async (params: lsp.ReferenceParams): Promise<lsp.Location[] | null> => {
            const uri = params.textDocument.uri

            if (isFiftFile(uri)) {
                const file = findFiftFile(uri)
                const node = nodeAtPosition(params, file)
                if (!node) return null
                return provideFiftReferences(node, file)
            }

            if (isTlbFile(uri)) {
                const file = findTlbFile(uri)
                const node = nodeAtPosition(params, file)
                if (!node) return null
                return provideTlbReferences(node, file)
            }

            if (isTactFile(uri)) {
                const file = findTactFile(uri)
                const node = nodeAtPosition(params, file)
                if (!node) return null
                return provideTactReferences(node, file)
            }

            return null
        },
    )

    connection.onRequest(
        lsp.SignatureHelpRequest.type,
        (params: lsp.SignatureHelpParams): lsp.SignatureHelp | null => {
            const uri = params.textDocument.uri

            if (isTactFile(uri)) {
                return provideTactSignatureInfo(params)
            }

            return null
        },
    )

    connection.onRequest(
        lsp.FoldingRangeRequest.type,
        (params: lsp.FoldingRangeParams): lsp.FoldingRange[] | null => {
            const uri = params.textDocument.uri

            if (isFiftFile(uri)) {
                const file = findFiftFile(uri)
                return provideFiftFoldingRanges(file)
            }

            if (isTactFile(uri)) {
                const file = findTactFile(uri)
                return provideTactFoldingRanges(file)
            }

            return null
        },
    )

    connection.onRequest(
        lsp.SemanticTokensRequest.type,
        async (params: lsp.SemanticTokensParams): Promise<lsp.SemanticTokens | null> => {
            const uri = params.textDocument.uri
            const settings = await getDocumentSettings(uri)

            if (isFiftFile(uri)) {
                const file = findFiftFile(uri)
                return provideFiftSemanticTokens(file, settings.fift.semanticHighlighting)
            }

            if (isTlbFile(uri)) {
                const file = findTlbFile(uri)
                return provideTlbSemanticTokens(file)
            }

            if (isTactFile(uri)) {
                const file = findTactFile(uri)
                return provideTactSemanticTokens(file, settings.highlighting)
            }

            return null
        },
    )

    connection.onRequest(
        lsp.CodeLensRequest.type,
        async (params: lsp.CodeLensParams): Promise<lsp.CodeLens[] | null> => {
            const uri = params.textDocument.uri

            if (isTactFile(uri)) {
                const file = findTactFile(uri)
                const settings = await getDocumentSettings(uri)
                return collectTactCodeLenses(file, settings.codeLens)
            }

            return null
        },
    )

    connection.onRequest(
        lsp.ExecuteCommandRequest.type,
        async (params: lsp.ExecuteCommandParams): Promise<string | null> => {
            return provideExecuteTactCommand(params)
        },
    )

    connection.onRequest(
        lsp.CodeActionRequest.type,
        (params: lsp.CodeActionParams): lsp.CodeAction[] | null => {
            const uri = params.textDocument.uri

            if (isTactFile(uri)) {
                const file = findTactFile(uri)
                return provideTactCodeActions(file, params)
            }

            return null
        },
    )

    connection.onRequest(
        lsp.DocumentSymbolRequest.type,
        async (params: lsp.DocumentSymbolParams): Promise<lsp.DocumentSymbol[]> => {
            const uri = params.textDocument.uri

            if (isTactFile(uri)) {
                const file = findTactFile(uri)
                return provideTactDocumentSymbols(file)
            }

            if (isTlbFile(uri)) {
                const file = findTlbFile(uri)
                return provideTlbDocumentSymbols(file)
            }

            return []
        },
    )

    connection.onRequest(lsp.WorkspaceSymbolRequest.type, provideTactWorkspaceSymbols)

    connection.onRequest(
        lsp.DocumentFormattingRequest.type,
        (params: lsp.DocumentFormattingParams): lsp.TextEdit[] | null => {
            const uri = params.textDocument.uri
            if (isFiftFile(uri) || isTlbFile(uri)) {
                return null
            }

            const file = findTactFile(uri)
            const formatted = formatCode(file.content)

            if (formatted.$ === "FormattedCode") {
                if (formatted.code === file.content) {
                    // already formatted
                    return null
                }

                const lines = file.content.split("\n")
                return [
                    {
                        range: {
                            start: {
                                line: 0,
                                character: 0,
                            },
                            end: {
                                line: lines.length,
                                character: (lines.at(-1) ?? "").length,
                            },
                        },
                        newText: formatted.code,
                    },
                ]
            }

            if (formatted.message === "cannot parse code") {
                showErrorMessage(`Cannot format file: ${formatted.message}`)
                return null
            }

            showErrorMessage(
                `Cannot format file: ${formatted.message}, please open a new issue with the file content: https://github.com/tact-lang/tact-language-server/issues`,
            )
            return null
        },
    )

    // Custom LSP requests

    connection.onRequest(
        TypeAtPositionRequest,
        (params: TypeAtPositionParams): TypeAtPositionResponse => {
            const uri = params.textDocument.uri

            if (isTactFile(uri)) {
                const file = findTactFile(uri)
                return provideTactTypeAtPosition(params, file)
            }

            return {type: null, range: null}
        },
    )

    connection.onRequest(DocumentationAtPositionRequest, provideDocumentation)
    connection.onRequest(GasConsumptionForSelectionRequest, provideSelectionGasConsumption)

    connection.onRequest(
        SearchByTypeRequest,
        (params: SearchByTypeParams): SearchByTypeResponse => {
            try {
                const results = TypeBasedSearch.search(params.query)
                return {
                    results,
                    error: null,
                }
            } catch (error) {
                console.error("Error in type-based search:", error)
                return {
                    results: [],
                    error: error instanceof Error ? error.message : "Unknown error",
                }
            }
        },
    )

    // eslint-disable-next-line @typescript-eslint/unbound-method
    const _needed = TypeInferer.inferType

    console.info("Tact language server is ready!")

    return {
        capabilities: {
            textDocumentSync: lsp.TextDocumentSyncKind.Incremental,
            documentFormattingProvider: true,
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
                resolveProvider: true,
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
                commands: ["tact/executeGetScopeProvider", ...INTENTIONS.map(it => it.id)],
            },
            workspace: {
                workspaceFolders: {
                    supported: true,
                    changeNotifications: true,
                },
                fileOperations: {
                    willRename: {
                        filters: [
                            {
                                scheme: "file",
                                pattern: {
                                    glob: "**/*.tact",
                                },
                            },
                        ],
                    },
                    didRename: {
                        filters: [
                            {
                                scheme: "file",
                                pattern: {
                                    glob: "**/*.tact",
                                },
                            },
                        ],
                    },
                },
            },
        },
    }
})

Logger.initialize(connection, `${__dirname}/tact-language-server.log`)

connection.listen()
