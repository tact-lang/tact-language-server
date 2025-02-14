import * as vscode from "vscode"
import {BocDecompilerProvider} from "./BocDecompilerProvider"

export class BocFileSystemProvider implements vscode.FileSystemProvider {
    private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>()
    readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event

    watch(_uri: vscode.Uri): vscode.Disposable {
        return new vscode.Disposable(() => {})
    }

    stat(_uri: vscode.Uri): vscode.FileStat {
        return {
            type: vscode.FileType.File,
            ctime: Date.now(),
            mtime: Date.now(),
            size: 0,
        }
    }

    readDirectory(_uri: vscode.Uri): [string, vscode.FileType][] {
        return []
    }

    createDirectory(_uri: vscode.Uri): void {}

    async readFile(uri: vscode.Uri): Promise<Uint8Array> {
        // При чтении .boc файла автоматически открываем его декомпилированную версию
        const decompileUri = uri.with({
            scheme: BocDecompilerProvider.scheme,
            path: uri.path + ".decompiled.fif",
        })

        const doc = await vscode.workspace.openTextDocument(decompileUri)
        await vscode.window.showTextDocument(doc, {
            preview: true,
            viewColumn: vscode.ViewColumn.Active,
        })

        // Возвращаем пустой массив, так как нам не нужно отображать содержимое бинарного файла
        return new Uint8Array()
    }

    writeFile(_uri: vscode.Uri, _content: Uint8Array): void {}

    delete(_uri: vscode.Uri): void {}

    rename(_oldUri: vscode.Uri, _newUri: vscode.Uri): void {}
}
