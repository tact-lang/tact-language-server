import * as vscode from 'vscode';
import { Utils as vscode_uri } from 'vscode-uri';
import {
    LanguageClient,
    LanguageClientOptions,
    RevealOutputChannelOn,
    ServerOptions,
    TransportKind
} from 'vscode-languageclient/node';
import * as path from "path";
import { consoleError, consoleLog, consoleWarn, createClientLog } from "./client-log";
import {getClientConfiguration} from "./client-config";
import {NotificationFromServer, RequestFromServer} from "../../shared/src/shared-msgtypes";
import {TextEncoder} from "util";
import {Position} from "vscode-languageclient";

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
    startServer(context).catch(consoleError)
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}

async function startServer(context: vscode.ExtensionContext): Promise<vscode.Disposable> {
    const disposables: vscode.Disposable[] = [];

    const clientOptions: LanguageClientOptions = {
        outputChannel: createClientLog(),
        revealOutputChannelOn: RevealOutputChannelOn.Never,
        documentSelector: [{ scheme: 'file', language: 'tact' }],
        initializationOptions: {
            clientConfig: getClientConfiguration(),
            treeSitterWasmUri: vscode_uri.joinPath(context.extensionUri, './dist/tree-sitter.wasm').fsPath,
            langWasmUri: vscode_uri.joinPath(context.extensionUri, './dist/tree-sitter-tact.wasm').fsPath,
        }
    };

    const serverModule = context.asAbsolutePath(
        path.join('dist', 'server.js')
    );

    const serverOptions: ServerOptions = {
        run: {
            module: serverModule,
            transport: TransportKind.ipc
        },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
            options: { execArgv: ['--nolazy', '--inspect=6009'] }	// same port as in .vscode/launch.json
        }
    };
    client = new LanguageClient(
        'tact-server',
        'Tact Language Server',
        serverOptions,
        clientOptions
    );

    await client.start();

    client.onRequest(RequestFromServer.fileReadContents, async raw => {
        const uri = vscode.Uri.parse(raw);

        if (uri.scheme === 'vscode-notebook-cell') {
            // we are dealing with a notebook
            try {
                const doc = await vscode.workspace.openTextDocument(uri);
                return new TextEncoder().encode(doc.getText());
            } catch (err) {
                consoleWarn(err);
                return { type: 'not-found' };
            }
        }

        if (vscode.workspace.fs.isWritableFileSystem(uri.scheme) === undefined) {
            // undefined means we don't know anything about these uris
            return { type: 'not-found' };
        }

        let data: Uint8Array;
        try {
            const stat = await vscode.workspace.fs.stat(uri);
            if (stat.size > 1024 ** 2) {
                consoleWarn(`IGNORING "${uri.toString()}" because it is too large (${stat.size}bytes)`);
                data = Buffer.from(new Uint8Array());
            } else {
                data = await vscode.workspace.fs.readFile(uri);
            }
            return data;
        } catch (err) {
            if (err instanceof vscode.FileSystemError) {
                return { type: 'not-found' };
            }
            // graceful
            consoleWarn(err);
            return { type: 'not-found' };
        }
    });

    client.onNotification(NotificationFromServer.showErrorMessage, (errTxt: string) => {
        vscode.window.showErrorMessage(errTxt)
    })

    vscode.commands.registerCommand('tact.showParent', async (uri: string, position: Position) => {
        await showReferencesImpl(client, uri, position);
    })

    async function showReferencesImpl(
        client: LanguageClient | undefined,
        uri: string,
        position: Position,
    ) {
        if (!client) return;
        await vscode.commands.executeCommand(
            "editor.action.showReferences",
            vscode.Uri.parse(uri),
            client.protocol2CodeConverter.asPosition(position),
            [],
        );
    }

    const langPattern = `**/*.tact`;
    const watcher = vscode.workspace.createFileSystemWatcher(langPattern);
    disposables.push(watcher);

    // file discover and watching. in addition to text documents we annouce and provide
    // all matching files

    // workaround for https://github.com/microsoft/vscode/issues/48674
    const exclude = `{${[
        ...Object.keys(vscode.workspace.getConfiguration('search', null).get('exclude') ?? {}),
        ...Object.keys(vscode.workspace.getConfiguration('files', null).get('exclude') ?? {}),
        "**/node_modules"
    ].join(',')}}`;

    // const init = async () => {
    //     let all = await vscode.workspace.findFiles(langPattern, exclude);
    //
    //     const uris = all.slice(0, 500);
    //     consoleLog(`USING ${uris.length} of ${all.length} files for ${langPattern}`);
    //
    //     await client.sendNotification(NotificationFromClient.initQueue, uris.map(String));
    // };
    //
    // const initCancel = new Promise<void>(resolve => disposables.push(new vscode.Disposable(resolve)));
    // vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: '[Tact] Building Index...' }, () => Promise.race([init(), initCancel]));

    // disposables.push(watcher.onDidCreate(uri => {
    //     client.sendNotification(NotificationFromClient.addFileToQueue, uri.toString());
    // }));
    // disposables.push(watcher.onDidDelete(uri => {
    //     client.sendNotification(NotificationFromClient.removeFileFromQueue, uri.toString());
    //     client.sendNotification(NotificationFromClient.removeFileFromFileCache, uri.toString());
    // }));
    // disposables.push(watcher.onDidChange(uri => {
    //     client.sendNotification(NotificationFromClient.addFileToQueue, uri.toString());
    //     client.sendNotification(NotificationFromClient.removeFileFromFileCache, uri.toString());
    // }));

    return new vscode.Disposable(() => disposables.forEach(d => d.dispose()));
}
