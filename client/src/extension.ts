//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import * as vscode from "vscode"
import * as path from "node:path"
import {Utils as vscode_uri} from "vscode-uri"
import {
    LanguageClient,
    LanguageClientOptions,
    RevealOutputChannelOn,
    ServerOptions,
    TransportKind,
} from "vscode-languageclient/node"
import {consoleError, createClientLog} from "./client-log"
import {getClientConfiguration} from "./client-config"
import {
    DocumentationAtPositionRequest,
    TypeAtPositionParams,
    TypeAtPositionRequest,
    TypeAtPositionResponse,
    SetToolchainVersionNotification,
    SetToolchainVersionParams,
    GasConsumptionForSelectionRequest,
    GasConsumptionForSelectionParams,
    GasConsumptionForSelectionResponse,
    SearchByTypeRequest,
    SearchByTypeParams,
    SearchByTypeResponse,
} from "@shared/shared-msgtypes"
import type {Location} from "vscode-languageclient"
import * as lsp from "vscode-languageserver-protocol"
import type {ClientOptions} from "@shared/config-scheme"
import {registerBuildTasks} from "./build-system"
import {Range, Position} from "vscode"
import {detectPackageManager, PackageManager} from "./utils/package-manager"
import {ToolchainConfig} from "@server/settings/settings"

let client: LanguageClient | null = null
let gasStatusBarItem: vscode.StatusBarItem | null = null
let cachedToolchainInfo: SetToolchainVersionParams | null = null

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    startServer(context).catch(consoleError)
    await registerBuildTasks(context)
    registerMistiCommand(context)
    registerGasConsumptionStatusBar(context)
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
            {scheme: "untitled", language: "tact"},
        ],
        synchronize: {
            configurationSection: "tact",
            fileEvents: vscode.workspace.createFileSystemWatcher("**/*.{tact,tlb}"),
        },
        initializationOptions: {
            clientConfig: getClientConfiguration(),
            treeSitterWasmUri: vscode_uri.joinPath(context.extensionUri, "./dist/tree-sitter.wasm")
                .fsPath,
            tactLangWasmUri: vscode_uri.joinPath(
                context.extensionUri,
                "./dist/tree-sitter-tact.wasm",
            ).fsPath,
            tlbLangWasmUri: vscode_uri.joinPath(context.extensionUri, "./dist/tree-sitter-tlb.wasm")
                .fsPath,
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

    client.onNotification(
        "tact/extractToFileWithInput",
        (params: ExtractToFileIntention) => void onExtractFile(params),
    )

    const langStatusBar = vscode.window.createStatusBarItem(
        "Tact",
        vscode.StatusBarAlignment.Left,
        60,
    )

    langStatusBar.text = "Tact"

    client.onNotification(SetToolchainVersionNotification, (params: SetToolchainVersionParams) => {
        cachedToolchainInfo = params

        const settings = vscode.workspace.getConfiguration("tact")
        const hash =
            settings.get<boolean>("toolchain.showShortCommitInStatusBar") &&
            params.version.commit.length > 8
                ? ` (${params.version.commit.slice(-8)})`
                : ""

        const activeToolchainId = settings.get<string>("toolchain.activeToolchain", "auto")
        const toolchains = settings.get<Record<string, ToolchainConfig | undefined>>(
            "toolchain.toolchains",
            {},
        )
        const activeToolchainName = toolchains[activeToolchainId]?.name ?? "Unknown"

        langStatusBar.text = `Tact ${params.version.number}${hash}`

        const tooltipLines = [
            `**Tact Toolchain Information**`,
            ``,
            `**Version:** ${params.version.number}`,
            ``,
            `**Commit:** ${params.version.commit || "Unknown"}`,
            ``,
            `**Active Toolchain:** ${activeToolchainName} (${activeToolchainId})`,
            ``,
            `**Toolchain:**`,
            `- Path: \`${params.toolchain.path}\``,
            `- Auto-detected: ${params.toolchain.isAutoDetected ? "Yes" : "No"}`,
            ...(params.toolchain.detectionMethod
                ? [`- Detection method: ${params.toolchain.detectionMethod}`]
                : []),
            ``,
            `**Environment:**`,
            `- Platform: ${params.environment.platform}`,
            `- Architecture: ${params.environment.arch}`,
            ...(params.environment.nodeVersion
                ? [`- Node.js: ${params.environment.nodeVersion}`]
                : []),
            ``,
            `*Click for more details or to switch toolchain*`,
        ]

        langStatusBar.tooltip = new vscode.MarkdownString(tooltipLines.join("\n"))
        langStatusBar.command = "tact.showToolchainInfo"
        langStatusBar.show()
    })

    return new vscode.Disposable(() => {
        disposables.forEach(d => void d.dispose())
    })
}

const onExtractFile = async (params: ExtractToFileIntention): Promise<void> => {
    try {
        const fileName = await vscode.window.showInputBox({
            prompt: `Enter filename for extracted ${params.elementName}`,
            value: params.suggestedFileName,
            validateInput: (value: string) => {
                if (!value.trim()) {
                    return "Filename cannot be empty"
                }
                if (!value.endsWith(".tact")) {
                    return "Filename must end with .tact"
                }
                if (!/^[\w-]+\.tact$/.test(value)) {
                    return "Filename contains invalid characters"
                }
                return null
            },
        })

        if (!fileName) return

        await client?.sendRequest("workspace/executeCommand", {
            command: "tact.extract-to-file",
            arguments: [
                {
                    fileUri: params.fileUri,
                    range: params.range,
                    position: params.position,
                    customFileName: fileName,
                },
            ],
        })
    } catch (error: unknown) {
        console.error("Error in extractToFileWithInput notification:", error)
        vscode.window.showErrorMessage(
            `Failed to extract to file: ${error instanceof Error ? error.message : ""}`,
        )
    }
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
        vscode.commands.registerCommand("tact.showToolchainInfo", async () => {
            if (!cachedToolchainInfo) {
                vscode.window.showInformationMessage("Toolchain information not available")
                return
            }

            const info = cachedToolchainInfo
            const config = vscode.workspace.getConfiguration("tact")
            const activeToolchainId = config.get<string>("toolchain.activeToolchain", "auto")
            const toolchains = config.get<Record<string, ToolchainConfig | undefined>>(
                "toolchain.toolchains",
                {},
            )
            const activeToolchainName = toolchains[activeToolchainId]?.name ?? "Unknown"

            const items = [
                {
                    label: "$(info) Version Information",
                    detail: `Tact ${info.version.number}`,
                    description: info.version.commit
                        ? `Commit: ${info.version.commit}`
                        : "No commit info",
                },
                {
                    label: "$(tools) Active Toolchain",
                    detail: `${activeToolchainName} (${activeToolchainId})`,
                    description: info.toolchain.path,
                },
                {
                    label: "$(device-desktop) Environment",
                    detail: `${info.environment.platform} ${info.environment.arch}`,
                    description: info.environment.nodeVersion
                        ? `Node.js ${info.environment.nodeVersion}`
                        : "Node.js version unknown",
                },
                {
                    label: "$(arrow-swap) Switch Toolchain",
                    detail: "Change active toolchain",
                    description: "Select a different toolchain configuration",
                    action: "switch",
                },
                {
                    label: "$(settings-gear) Manage Toolchains",
                    detail: "Add, remove, or configure toolchains",
                    description: "Open toolchain management",
                    action: "manage",
                },
                {
                    label: "$(copy) Copy Information",
                    detail: "Copy toolchain info to clipboard",
                    description: "Copy all toolchain details",
                    action: "copy",
                },
            ]

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: "Tact Toolchain Information",
                canPickMany: false,
            })

            if (selected) {
                switch (selected.action) {
                    case "switch": {
                        await vscode.commands.executeCommand("tact.selectToolchain")
                        break
                    }
                    case "manage": {
                        await vscode.commands.executeCommand("tact.manageToolchains")
                        break
                    }
                    case "copy": {
                        const clipboardText = `Tact Toolchain Information:
Version: ${info.version.number}
Commit: ${info.version.commit || "Unknown"}
Active Toolchain: ${activeToolchainName} (${activeToolchainId})
Path: ${info.toolchain.path}
Auto-detected: ${info.toolchain.isAutoDetected}
Detection method: ${info.toolchain.detectionMethod ?? "Unknown"}
Platform: ${info.environment.platform}
Architecture: ${info.environment.arch}
Node.js: ${info.environment.nodeVersion ?? "Unknown"}`

                        await vscode.env.clipboard.writeText(clipboardText)
                        vscode.window.showInformationMessage(
                            "Toolchain information copied to clipboard",
                        )
                        break
                    }
                    case undefined: {
                        break
                    }
                }
            }
        }),
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
            TypeAtPositionRequest,
            async (params: TypeAtPositionParams | undefined) => {
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

                const result = await client.sendRequest<TypeAtPositionResponse>(
                    TypeAtPositionRequest,
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
            DocumentationAtPositionRequest,
            async (params: TypeAtPositionParams | undefined) => {
                if (!client || !params) {
                    return null
                }

                return client.sendRequest<TypeAtPositionResponse>(
                    DocumentationAtPositionRequest,
                    params,
                )
            },
        ),
        vscode.commands.registerCommand(SearchByTypeRequest, async (params: SearchByTypeParams) => {
            if (!client) {
                return {results: [], error: "Language server not running"}
            }

            return client.sendRequest<SearchByTypeResponse>(SearchByTypeRequest, params)
        }),
        vscode.commands.registerCommand("tact.searchByType", async () => {
            if (!client) {
                vscode.window.showErrorMessage("Tact Language Server is not running")
                return
            }

            const query = await vscode.window.showInputBox({
                prompt: "Enter type signature (e.g., 'Int -> String', '_ -> Address')",
                placeHolder: "Int -> String",
                validateInput: (value: string) => {
                    if (!value.trim()) {
                        return "Type signature cannot be empty"
                    }
                    if (!value.includes("->")) {
                        return "Type signature must include '->'"
                    }
                    return null
                },
            })

            if (!query) return

            try {
                const config = vscode.workspace.getConfiguration("tact")
                const scope = config.get<"workspace" | "everywhere">(
                    "findUsages.scope",
                    "workspace",
                )

                const params: SearchByTypeParams = {
                    query: query.trim(),
                    scope,
                }

                const response = await client.sendRequest<SearchByTypeResponse>(
                    SearchByTypeRequest,
                    params,
                )

                if (response.error) {
                    vscode.window.showErrorMessage(`Search failed: ${response.error}`)
                    return
                }

                if (response.results.length === 0) {
                    vscode.window.showInformationMessage(`No functions found matching "${query}"`)
                    return
                }

                // Convert results to QuickPickItems
                // eslint-disable-next-line functional/type-declaration-immutability
                interface SearchResultItem extends vscode.QuickPickItem {
                    readonly location: lsp.Location
                    readonly resultKind: string
                }

                const items: SearchResultItem[] = response.results.map(result => ({
                    label: result.name,
                    description: result.signature,
                    detail: result.containerName ? `in ${result.containerName}` : undefined,
                    location: result.location,
                    resultKind: result.kind,
                }))

                const selected = await vscode.window.showQuickPick(items, {
                    placeHolder: `Found ${response.results.length} function(s) matching "${query}"`,
                    matchOnDescription: true,
                    matchOnDetail: true,
                })

                if (selected) {
                    const uri = vscode.Uri.parse(selected.location.uri)
                    const range = new vscode.Range(
                        new vscode.Position(
                            selected.location.range.start.line,
                            selected.location.range.start.character,
                        ),
                        new vscode.Position(
                            selected.location.range.end.line,
                            selected.location.range.end.character,
                        ),
                    )

                    const document = await vscode.workspace.openTextDocument(uri)
                    const editor = await vscode.window.showTextDocument(document)
                    editor.selection = new vscode.Selection(range.start, range.end)
                    editor.revealRange(range, vscode.TextEditorRevealType.InCenter)
                }
            } catch (error) {
                console.error("Error in searchByType command:", error)
                vscode.window.showErrorMessage(
                    `Search failed: ${error instanceof Error ? error.message : "Unknown error"}`,
                )
            }
        }),
        vscode.commands.registerCommand("tact.selectToolchain", async () => {
            const config = vscode.workspace.getConfiguration("tact")
            const toolchains = config.get<Record<string, ToolchainConfig>>(
                "toolchain.toolchains",
                {},
            )
            const activeToolchain = config.get<string>("toolchain.activeToolchain", "auto")

            const items = Object.entries(toolchains).map(([id, toolchain]) => ({
                label: `$(${id === activeToolchain ? "check" : "circle-outline"}) ${toolchain.name}`,
                description: toolchain.description ?? "",
                detail: toolchain.path || "Auto-detected",
                id: id,
                picked: id === activeToolchain,
            }))

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: "Select active toolchain",
                canPickMany: false,
            })

            if (selected && selected.id !== activeToolchain) {
                await config.update(
                    "toolchain.activeToolchain",
                    selected.id,
                    vscode.ConfigurationTarget.Workspace,
                )
                vscode.window.showInformationMessage(
                    `Switched to toolchain: ${selected.label.replace(/^\$\([^)]+\)\s*/, "")}`,
                )
            }
        }),
        vscode.commands.registerCommand("tact.manageToolchains", async () => {
            const config = vscode.workspace.getConfiguration("tact")
            const toolchains = config.get<Record<string, ToolchainConfig>>(
                "toolchain.toolchains",
                {},
            )

            const items = [
                {
                    label: "$(add) Add New Toolchain",
                    description: "Add a new Tact toolchain configuration",
                    action: "add",
                },
                {
                    label: "$(list-unordered) List All Toolchains",
                    description: "View all configured toolchains",
                    action: "list",
                },
                {
                    label: "$(trash) Remove Toolchain",
                    description: "Remove an existing toolchain configuration",
                    action: "remove",
                },
            ]

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: "Manage Tact Toolchains",
            })

            if (selected) {
                switch (selected.action) {
                    case "add": {
                        await vscode.commands.executeCommand("tact.addToolchain")
                        break
                    }
                    case "list": {
                        const toolchainItems = Object.entries(toolchains).map(
                            ([id, toolchain]) => ({
                                label: toolchain.name,
                                description: toolchain.description ?? "",
                                detail: `ID: ${id}, Path: ${toolchain.path || "Auto-detected"}`,
                            }),
                        )

                        await vscode.window.showQuickPick(toolchainItems, {
                            placeHolder: "Configured Toolchains",
                        })
                        break
                    }
                    case "remove": {
                        await vscode.commands.executeCommand("tact.removeToolchain")
                        break
                    }
                }
            }
        }),
        vscode.commands.registerCommand("tact.addToolchain", async () => {
            const id = await vscode.window.showInputBox({
                prompt: "Enter unique ID for the new toolchain",
                placeHolder: "e.g., tact-1.6.0, local-build",
                validateInput: (value: string) => {
                    if (!value.trim()) return "ID cannot be empty"
                    if (!/^[\w-]+$/.test(value))
                        return "ID can only contain letters, numbers, hyphens, and underscores"

                    const config = vscode.workspace.getConfiguration("tact")
                    const toolchains = config.get<Record<string, ToolchainConfig | undefined>>(
                        "toolchain.toolchains",
                        {},
                    )
                    if (toolchains[value]) return "A toolchain with this ID already exists"

                    return null
                },
            })

            if (!id) return

            const name = await vscode.window.showInputBox({
                prompt: "Enter display name for the toolchain",
                placeHolder: "e.g., Tact 1.6.0, Local Development Build",
            })

            if (!name) return

            const pathOptions = [
                {label: "$(file-directory) Browse for executable", action: "browse"},
                {label: "$(edit) Enter path manually", action: "manual"},
            ]

            const pathOption = await vscode.window.showQuickPick(pathOptions, {
                placeHolder: "How would you like to specify the compiler path?",
            })

            if (!pathOption) return

            let path = ""
            if (pathOption.action === "browse") {
                const fileUri = await vscode.window.showOpenDialog({
                    canSelectFiles: true,
                    canSelectFolders: false,
                    canSelectMany: false,
                    filters: {
                        Executables: process.platform === "win32" ? ["exe"] : ["*"],
                    },
                    title: "Select Tact Compiler Executable",
                })

                if (fileUri && fileUri[0]) {
                    path = fileUri[0].fsPath
                }
            } else {
                const manualPath = await vscode.window.showInputBox({
                    prompt: "Enter path to Tact compiler executable",
                    placeHolder: "/usr/local/bin/tact or ./node_modules/.bin/tact",
                })
                if (manualPath) {
                    path = manualPath
                }
            }

            if (!path) return

            const description = await vscode.window.showInputBox({
                prompt: "Enter optional description for the toolchain",
                placeHolder: "e.g., Latest stable version, Development build",
            })

            const config = vscode.workspace.getConfiguration("tact")
            const toolchains = config.get<Record<string, ToolchainConfig | undefined>>(
                "toolchain.toolchains",
                {},
            )

            toolchains[id] = {
                name,
                path,
                ...(description && {description}),
            }

            await config.update(
                "toolchain.toolchains",
                toolchains,
                vscode.ConfigurationTarget.Workspace,
            )

            const activateNow = await vscode.window.showInformationMessage(
                `Added toolchain: ${name}. Do you want to activate it now?`,
                "Activate",
                "Keep Current",
            )

            if (activateNow === "Activate") {
                await config.update(
                    "toolchain.activeToolchain",
                    id,
                    vscode.ConfigurationTarget.Workspace,
                )
                vscode.window.showInformationMessage(`Activated toolchain: ${name}`)
            } else {
                vscode.window.showInformationMessage(`Toolchain ${name} added but not activated`)
            }
        }),
        vscode.commands.registerCommand("tact.removeToolchain", async () => {
            const config = vscode.workspace.getConfiguration("tact")
            const toolchains = config.get<Record<string, ToolchainConfig>>(
                "toolchain.toolchains",
                {},
            )
            const activeToolchain = config.get<string>("toolchain.activeToolchain", "auto")

            const removableToolchains = Object.entries(toolchains).filter(([id]) => id !== "auto")

            if (removableToolchains.length === 0) {
                vscode.window.showInformationMessage("No removable toolchains found")
                return
            }

            const items = removableToolchains.map(([id, toolchain]) => ({
                label: toolchain.name,
                description: toolchain.description ?? "",
                detail: `ID: ${id}, Path: ${toolchain.path}`,
                id: id,
            }))

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: "Select toolchain to remove",
            })

            if (!selected) return

            const confirmation = await vscode.window.showWarningMessage(
                `Are you sure you want to remove the toolchain "${selected.label}"?`,
                {modal: true},
                "Remove",
                "Cancel",
            )

            if (confirmation === "Remove") {
                // Create a new object without the selected toolchain instead of modifying the existing one
                const updatedToolchains = Object.fromEntries(
                    Object.entries(toolchains).filter(([id]) => id !== selected.id),
                )

                await config.update(
                    "toolchain.toolchains",
                    updatedToolchains,
                    vscode.ConfigurationTarget.Workspace,
                )

                if (activeToolchain === selected.id) {
                    await config.update(
                        "toolchain.activeToolchain",
                        "auto",
                        vscode.ConfigurationTarget.Workspace,
                    )
                    vscode.window.showInformationMessage(
                        `Removed toolchain "${selected.label}" and switched to auto-detection`,
                    )
                } else {
                    vscode.window.showInformationMessage(`Removed toolchain: ${selected.label}`)
                }
            }
        }),
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

    try {
        const packageJsonContent = await vscode.workspace.fs.readFile(
            vscode.Uri.joinPath(workspaceFolders[0].uri, "package.json"),
        )
        const packageJson = JSON.parse(new TextDecoder().decode(packageJsonContent)) as {
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

function registerGasConsumptionStatusBar(context: vscode.ExtensionContext): void {
    gasStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000)
    context.subscriptions.push(
        gasStatusBarItem,
        vscode.window.onDidChangeTextEditorSelection(async event => {
            await updateGasStatusBar(event.textEditor)
        }),
        vscode.window.onDidChangeActiveTextEditor(async editor => {
            if (editor) {
                await updateGasStatusBar(editor)
            } else {
                hideGasStatusBar()
            }
        }),
        vscode.workspace.onDidChangeConfiguration(async event => {
            if (event.affectsConfiguration("tact.gas.showGasStatusBar")) {
                const editor = vscode.window.activeTextEditor
                if (editor) {
                    await updateGasStatusBar(editor)
                } else {
                    hideGasStatusBar()
                }
            }
        }),
    )
}

async function updateGasStatusBar(editor: vscode.TextEditor): Promise<void> {
    if (!gasStatusBarItem || !client) {
        return
    }

    const config = vscode.workspace.getConfiguration("tact")
    const showGasStatusBar = config.get<boolean>("gas.showGasStatusBar", true)

    if (!showGasStatusBar) {
        hideGasStatusBar()
        return
    }

    if (!editor.document.fileName.endsWith(".tact")) {
        hideGasStatusBar()
        return
    }

    const selection = editor.selection
    if (selection.isEmpty) {
        hideGasStatusBar()
        return
    }

    try {
        const params: GasConsumptionForSelectionParams = {
            textDocument: {
                uri: editor.document.uri.toString(),
            },
            range: {
                start: {
                    line: selection.start.line,
                    character: selection.start.character,
                },
                end: {
                    line: selection.end.line,
                    character: selection.end.character,
                },
            },
        }

        const result = await client.sendRequest<GasConsumptionForSelectionResponse>(
            GasConsumptionForSelectionRequest,
            params,
        )

        if (result.error) {
            hideGasStatusBar()
            return
        }

        if (!result.gasConsumption) {
            hideGasStatusBar()
            return
        }

        const {value, exact, unknown} = result.gasConsumption

        if (unknown) {
            gasStatusBarItem.text = " Gas: Unknown"
            gasStatusBarItem.tooltip = "Contains instructions with unknown gas costs"
        } else if (value === 0) {
            hideGasStatusBar()
            return
        } else {
            const prefix = exact ? "" : "~"
            gasStatusBarItem.text = `Gas: ${prefix}${value}`
            gasStatusBarItem.tooltip = `Gas consumption for selected assembly code: ${prefix}${value} gas units`
        }

        gasStatusBarItem.show()
    } catch {
        hideGasStatusBar()
    }
}

function hideGasStatusBar(): void {
    if (gasStatusBarItem) {
        gasStatusBarItem.hide()
    }
}

export interface ExtractToFileIntention {
    readonly fileUri: string
    readonly range: Range
    readonly position: Position
    readonly elementName?: string
    readonly suggestedFileName?: string
}
