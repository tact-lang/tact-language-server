import * as vscode from "vscode"
import {Utils as vscode_uri} from "vscode-uri"
import {
    LanguageClient,
    LanguageClientOptions,
    RevealOutputChannelOn,
    ServerOptions,
    TransportKind,
} from "vscode-languageclient/node"
import * as path from "node:path"
import {consoleError, createClientLog} from "./client-log"
import {getClientConfiguration} from "./client-config"
import {
    GetDocumentationAtPositionRequest,
    GetTypeAtPositionParams,
    GetTypeAtPositionRequest,
    GetTypeAtPositionResponse,
    SetToolchainVersionNotification,
    SetToolchainVersionParams,
} from "@shared/shared-msgtypes"
import type {Location, Position} from "vscode-languageclient"
import type {ClientOptions} from "@shared/config-scheme"
import {registerBuildTasks} from "./build-system"
import {registerOpenBocCommand} from "./commands/openBocCommand"
import {BocEditorProvider} from "./providers/BocEditorProvider"
import {BocFileSystemProvider} from "./providers/BocFileSystemProvider"
import {BocDecompilerProvider} from "./providers/BocDecompilerProvider"
import {registerSaveBocDecompiledCommand} from "./commands/saveBocDecompiledCommand"

let client: LanguageClient | null = null

export function activate(context: vscode.ExtensionContext): void {
    startServer(context).catch(consoleError)
    registerBuildTasks(context)
    registerOpenBocCommand(context)
    registerSaveBocDecompiledCommand(context)

    const config = vscode.workspace.getConfiguration("tact")
    const openDecompiled = config.get<boolean>("boc.openDecompiledOnOpen")
    if (openDecompiled) {
        BocEditorProvider.register()

        const bocFsProvider = new BocFileSystemProvider()
        context.subscriptions.push(
            vscode.workspace.registerFileSystemProvider("boc", bocFsProvider, {
                isCaseSensitive: true,
                isReadonly: false,
            }),
        )
    }

    const bocDecompilerProvider = new BocDecompilerProvider()
    context.subscriptions.push(
        vscode.workspace.registerTextDocumentContentProvider(
            BocDecompilerProvider.scheme,
            bocDecompilerProvider,
        ),
    )
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined
    }
    return client.stop()
}

async function startServer(context: vscode.ExtensionContext): Promise<vscode.Disposable> {
    const disposables: vscode.Disposable[] = []

    const clientOptions: LanguageClientOptions = {
        outputChannel: createClientLog(),
        revealOutputChannelOn: RevealOutputChannelOn.Never,
        documentSelector: [
            {scheme: "file", language: "tact"},
            {scheme: "file", language: "fift"},
            {scheme: "untitled", language: "tact"},
        ],
        synchronize: {
            configurationSection: "tact",
            fileEvents: vscode.workspace.createFileSystemWatcher("**/*.tact"),
        },
        initializationOptions: {
            clientConfig: getClientConfiguration(),
            treeSitterWasmUri: vscode_uri.joinPath(context.extensionUri, "./dist/tree-sitter.wasm")
                .fsPath,
            tactLangWasmUri: vscode_uri.joinPath(
                context.extensionUri,
                "./dist/tree-sitter-tact.wasm",
            ).fsPath,
            fiftLangWasmUri: vscode_uri.joinPath(
                context.extensionUri,
                "./dist/tree-sitter-fift.wasm",
            ).fsPath,
        } as ClientOptions,
    }

    const serverModule = context.asAbsolutePath(path.join("dist", "server.js"))

    const serverOptions: ServerOptions = {
        run: {
            module: serverModule,
            transport: TransportKind.ipc,
        },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
            options: {execArgv: ["--nolazy", "--inspect=6009"]}, // same port as in .vscode/launch.json
        },
    }
    client = new LanguageClient("tact-server", "Tact Language Server", serverOptions, clientOptions)

    await client.start()

    registerCommands(disposables)

    const langStatusBar = vscode.window.createStatusBarItem(
        "Tact",
        vscode.StatusBarAlignment.Left,
        60,
    )

    langStatusBar.text = "Tact"

    client.onNotification(SetToolchainVersionNotification, (version: SetToolchainVersionParams) => {
        const settings = vscode.workspace.getConfiguration("tact")
        const hash =
            settings.get<boolean>("toolchain.showShortCommitInStatusBar") &&
            version.version.commit.length > 8
                ? ` (${version.version.commit.slice(-8)})`
                : ""

        langStatusBar.text = `Tact ${version.version.number}${hash}`
        langStatusBar.show()
    })

    return new vscode.Disposable(() => {
        disposables.forEach(d => void d.dispose())
    })
}

async function showReferencesImpl(
    client: LanguageClient | undefined,
    uri: string,
    position: Position,
): Promise<void> {
    if (!client) return
    await vscode.commands.executeCommand(
        "editor.action.showReferences",
        vscode.Uri.parse(uri),
        client.protocol2CodeConverter.asPosition(position),
        [],
    )
}

function registerCommands(disposables: vscode.Disposable[]): void {
    disposables.push(
        vscode.commands.registerCommand(
            "tact.showParent",
            async (uri: string, position: Position) => {
                if (!client) return
                await showReferencesImpl(client, uri, position)
            },
        ),
        vscode.commands.registerCommand(
            "tact.showReferences",
            async (uri: string, position: Position, locations: Location[]) => {
                if (!client) return
                const thisClient = client
                await vscode.commands.executeCommand(
                    "editor.action.showReferences",
                    vscode.Uri.parse(uri),
                    client.protocol2CodeConverter.asPosition(position),
                    locations.map(element => thisClient.protocol2CodeConverter.asLocation(element)),
                )
            },
        ),
        vscode.commands.registerCommand(
            GetTypeAtPositionRequest,
            async (params: GetTypeAtPositionParams | undefined) => {
                if (!client) {
                    return null
                }

                const isFromEditor = !params
                if (!params) {
                    const editor = vscode.window.activeTextEditor
                    if (!editor) {
                        return null
                    }

                    params = {
                        textDocument: {
                            uri: editor.document.uri.toString(),
                        },
                        position: {
                            line: editor.selection.active.line,
                            character: editor.selection.active.character,
                        },
                    }
                }

                const result = await client.sendRequest<GetTypeAtPositionResponse>(
                    GetTypeAtPositionRequest,
                    params,
                )

                if (isFromEditor && result.type) {
                    void vscode.window.showInformationMessage(`Type: ${result.type}`)
                }

                return result
            },
        ),
        vscode.commands.registerCommand(
            GetDocumentationAtPositionRequest,
            async (params: GetTypeAtPositionParams | undefined) => {
                if (!client || !params) {
                    return null
                }

                return client.sendRequest<GetTypeAtPositionResponse>(
                    GetDocumentationAtPositionRequest,
                    params,
                )
            },
        ),
    )
}
