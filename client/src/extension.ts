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
import {NotificationFromServer} from "../../shared/src/shared-msgtypes";

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

    client.onNotification(NotificationFromServer.showErrorMessage, (errTxt: string) => {
        vscode.window.showErrorMessage(errTxt)
    })

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
