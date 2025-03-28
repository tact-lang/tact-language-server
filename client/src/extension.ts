import * as vscode from "vscode"
import {Position, Range, Uri} from "vscode"
import {Utils as vscode_uri} from "vscode-uri"
import type * as lspCommon from "vscode-languageclient/lib/common/client"
import type * as lsp from "vscode-languageclient"
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
import type {ClientOptions} from "@shared/config-scheme"
import {registerBuildTasks} from "./build-system"
import {registerOpenBocCommand} from "./commands/openBocCommand"
import {BocEditorProvider} from "./providers/BocEditorProvider"
import {BocFileSystemProvider} from "./providers/BocFileSystemProvider"
import {BocDecompilerProvider} from "./providers/BocDecompilerProvider"
import {registerSaveBocDecompiledCommand} from "./commands/saveBocDecompiledCommand"
import {detectPackageManager, PackageManager} from "./utils/package-manager"

let client: lspCommon.BaseLanguageClient | null = null

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    const params: LanguageServerCreationParams = {
        environment: typeof globalThis === "undefined" ? "node" : "browser",
    }

    startServer(context, params).catch(consoleError)
    await registerBuildTasks(context)
    registerOpenBocCommand(context)
    registerSaveBocDecompiledCommand(context)
    registerMistiCommand(context)

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

export type LanguageServerCreationParams =
    | {
          environment: "node"
      }
    | {
          environment: "browser"
      }

export async function startServer(
    context: vscode.ExtensionContext,
    _params: LanguageServerCreationParams,
): Promise<vscode.Disposable> {
    const disposables: vscode.Disposable[] = []

    if (typeof globalThis === "undefined") {
        const lspNode = await import("vscode-languageclient/node")

        const clientOptions: lspCommon.LanguageClientOptions = {
            outputChannel: createClientLog(),
            revealOutputChannelOn: lspNode.RevealOutputChannelOn.Never,
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
                treeSitterWasmUri: vscode_uri.joinPath(
                    context.extensionUri,
                    "./dist/tree-sitter.wasm",
                ).fsPath,
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

        const serverModule = context.asAbsolutePath("dist/server.js")

        const serverOptions = {
            run: {
                module: serverModule,
                transport: lspNode.TransportKind.ipc,
            },
            debug: {
                module: serverModule,
                transport: lspNode.TransportKind.ipc,
                options: {execArgv: ["--nolazy", "--inspect=6009"]}, // same port as in .vscode/launch.json
            },
        }
        client = new lspNode.LanguageClient(
            "tact-server",
            "Tact Language Server",
            serverOptions,
            clientOptions,
        )
    } else {
        const lspBrowser = await import("vscode-languageclient/browser")

        const clientOptions: lspCommon.LanguageClientOptions = {
            outputChannel: createClientLog(),
            revealOutputChannelOn: lspBrowser.RevealOutputChannelOn.Never,
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
                treeSitterWasmUri: vscode_uri.joinPath(
                    context.extensionUri,
                    "./dist/tree-sitter.wasm",
                ).fsPath,
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

        const worker = new Worker("dist/server.js")
        client = new lspBrowser.LanguageClient(
            "tact-server",
            "Tact Language Server",
            clientOptions,
            worker,
        )
    }

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

    client.onRequest("tact.readFile", async (params: {uri: string}) => {
        try {
            const data = await vscode.workspace.fs.readFile(Uri.parse(params.uri))
            return Buffer.from(data).toString("utf8")
        } catch {}

        // eslint-disable-next-line unicorn/no-useless-undefined
        return undefined
    })

    return new vscode.Disposable(() => {
        disposables.forEach(d => void d.dispose())
    })
}

async function showReferencesImpl(
    client: lspCommon.BaseLanguageClient | undefined,
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
            async (uri: string, position: Position, locations: lsp.Location[]) => {
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
                    const editor = vscode.window.activeTextEditor
                    if (editor && result.range) {
                        const range = new Range(
                            new Position(result.range.start.line, result.range.start.character),
                            new Position(result.range.end.line, result.range.end.character),
                        )

                        editor.selections = [new vscode.Selection(range.start, range.end)]
                        editor.revealRange(range)
                    }

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

function getInstallCommandForMisti(packageManager: PackageManager): string {
    switch (packageManager) {
        case "bun": {
            return "bun add -d @nowarp/misti"
        }
        case "yarn": {
            return "yarn add -D @nowarp/misti"
        }
        case "pnpm": {
            return "pnpm add -D @nowarp/misti"
        }
        case "npm": {
            return "npm install --save-dev @nowarp/misti"
        }
        default: {
            return ""
        }
    }
}

async function projectUsesMisti(): Promise<boolean> {
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (!workspaceFolders || workspaceFolders.length === 0) return false

    const packageJsonPath = vscode.Uri.joinPath(workspaceFolders[0].uri, "package.json")

    try {
        const contentArray = await vscode.workspace.fs.readFile(packageJsonPath)
        const content = Buffer.from(contentArray).toString("utf8")
        const packageJson = JSON.parse(content) as {
            dependencies?: Record<string, unknown>
            devDependencies?: Record<string, unknown>
        }
        return (
            packageJson.dependencies?.["@nowarp/misti"] !== undefined ||
            packageJson.devDependencies?.["@nowarp/misti"] !== undefined
        )
    } catch {
        // ignore any errors
    }

    return false
}

function registerMistiCommand(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.commands.registerCommand("tact.runMisti", async () => {
            if (!(await projectUsesMisti())) {
                const packageManager = await detectPackageManager()
                const installCommand = getInstallCommandForMisti(packageManager)

                const result = await vscode.window.showErrorMessage(
                    "Misti is not installed in your project. Would you like to install it?",
                    "Install Misti",
                    "Cancel",
                )

                if (result === "Install Misti") {
                    const terminal = vscode.window.createTerminal("Install Misti")
                    terminal.show()
                    terminal.sendText(installCommand)
                }
                return
            }

            const settings = vscode.workspace.getConfiguration("tact")
            const mistiBinPath = settings.get<string>("linters.misti.binPath") ?? "npx"

            // Handle a case when user specified "npx misti" command
            const [executable, ...args] = mistiBinPath.split(" ")

            const task = new vscode.Task(
                {type: "misti"},
                vscode.TaskScope.Workspace,
                "Run Misti Analysis",
                "Misti",
                new vscode.ShellExecution(executable, [...args, "./tact.config.json"]),
            )

            task.presentationOptions = {
                reveal: vscode.TaskRevealKind.Always,
                panel: vscode.TaskPanelKind.Dedicated,
                focus: true,
            }

            const useProblemMatcher = settings.get<boolean>("linters.useProblemMatcher") ?? false
            if (useProblemMatcher) {
                task.problemMatchers = ["$tact"]
            }

            await vscode.tasks.executeTask(task)
        }),
    )
}
