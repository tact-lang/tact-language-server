import * as vscode from "vscode"
import {Utils as vscode_uri} from "vscode-uri"
import {
    LanguageClient,
    LanguageClientOptions,
    RevealOutputChannelOn,
    ServerOptions,
    TransportKind,
} from "vscode-languageclient/node"
import * as path from "path"
import {consoleError, consoleWarn, createClientLog} from "./client-log"
import {getClientConfiguration} from "./client-config"
import {
    GetDocumentationAtPositionRequest,
    GetTypeAtPositionParams,
    GetTypeAtPositionRequest,
    GetTypeAtPositionResponse,
    NotificationFromServer,
    RequestFromServer,
} from "@shared/shared-msgtypes"
import {TextEncoder} from "util"
import {Location, Position} from "vscode-languageclient"
import {ClientOptions} from "@shared/config-scheme"
import * as lsp from "vscode-languageserver"

let client: LanguageClient

export function activate(context: vscode.ExtensionContext) {
    startServer(context).catch(consoleError)

    context.subscriptions.push(
        vscode.commands.registerCommand("tact.extractVariable", async () => {
            const editor = vscode.window.activeTextEditor
            if (!editor) return

            try {
                const selection = editor.selection
                if (selection.isEmpty) {
                    vscode.window.showErrorMessage("Please select an expression to extract")
                    return
                }

                const result: lsp.WorkspaceEdit = await vscode.commands.executeCommand(
                    "tact/extractVariable",
                    {
                        textDocument: {uri: editor.document.uri.toString()},
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
                    },
                )

                if (result && result.changes) {
                    const workspaceEdit = new vscode.WorkspaceEdit()

                    for (const [uri, edits] of Object.entries(result.changes)) {
                        const resourceUri = vscode.Uri.parse(uri)
                        edits.forEach(edit => {
                            workspaceEdit.replace(
                                resourceUri,
                                new vscode.Range(
                                    new vscode.Position(
                                        edit.range.start.line,
                                        edit.range.start.character,
                                    ),
                                    new vscode.Position(
                                        edit.range.end.line,
                                        edit.range.end.character,
                                    ),
                                ),
                                edit.newText,
                            )
                        })
                    }

                    const success = await vscode.workspace.applyEdit(workspaceEdit)
                    if (success) {
                        for (const [uri, edits] of Object.entries(result.changes)) {
                            const varDeclaration = edits.find(edit => edit.newText.includes("let"))
                            if (varDeclaration) {
                                const varNamePos = new vscode.Position(
                                    varDeclaration.range.start.line,
                                    varDeclaration.range.start.character + "        let ".length,
                                )

                                const doc = await vscode.workspace.openTextDocument(
                                    vscode.Uri.parse(uri),
                                )
                                const editor = await vscode.window.showTextDocument(doc)

                                editor.selection = new vscode.Selection(varNamePos, varNamePos)

                                await vscode.commands.executeCommand("editor.action.rename")
                                break
                            }
                        }
                    }
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to extract variable: ${error}`)
            }
        }),
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

    client.onRequest(RequestFromServer.fileReadContents, async (raw: string) => {
        const uri = vscode.Uri.parse(raw)

        if (uri.scheme === "vscode-notebook-cell") {
            // we are dealing with a notebook
            try {
                const doc = await vscode.workspace.openTextDocument(uri)
                return new TextEncoder().encode(doc.getText())
            } catch (err) {
                consoleWarn(err)
                return {type: "not-found"}
            }
        }

        if (vscode.workspace.fs.isWritableFileSystem(uri.scheme) === undefined) {
            // undefined means we don't know anything about these uris
            return {type: "not-found"}
        }

        let data: Uint8Array
        try {
            const stat = await vscode.workspace.fs.stat(uri)
            if (stat.size > 1024 ** 2) {
                consoleWarn(
                    `IGNORING "${uri.toString()}" because it is too large (${stat.size}bytes)`,
                )
                data = Buffer.from(new Uint8Array())
            } else {
                data = await vscode.workspace.fs.readFile(uri)
            }
            return data
        } catch (err) {
            if (err instanceof vscode.FileSystemError) {
                return {type: "not-found"}
            }
            // graceful
            consoleWarn(err)
            return {type: "not-found"}
        }
    })

    client.onNotification(NotificationFromServer.showErrorMessage, (errTxt: string) => {
        void vscode.window.showErrorMessage(errTxt)
    })

    vscode.commands.registerCommand("tact.showParent", async (uri: string, position: Position) => {
        await showReferencesImpl(client, uri, position)
    })

    async function showReferencesImpl(
        client: LanguageClient | undefined,
        uri: string,
        position: Position,
    ) {
        if (!client) return
        await vscode.commands.executeCommand(
            "editor.action.showReferences",
            vscode.Uri.parse(uri),
            client.protocol2CodeConverter.asPosition(position),
            [],
        )
    }

    vscode.commands.registerCommand(
        "tact.showReferences",
        async (uri: string, position: Position, locations: Location[]) => {
            if (!client) return
            await vscode.commands.executeCommand(
                "editor.action.showReferences",
                vscode.Uri.parse(uri),
                client.protocol2CodeConverter.asPosition(position),
                locations.map(client.protocol2CodeConverter.asLocation),
            )
        },
    )

    context.subscriptions.push(
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
    )

    context.subscriptions.push(
        vscode.commands.registerCommand(
            GetDocumentationAtPositionRequest,
            async (params: GetTypeAtPositionParams | undefined) => {
                if (!client || !params) {
                    return null
                }

                return await client.sendRequest<GetTypeAtPositionResponse>(
                    GetDocumentationAtPositionRequest,
                    params,
                )
            },
        ),
    )

    return new vscode.Disposable(() => disposables.forEach(d => void d.dispose()))
}
