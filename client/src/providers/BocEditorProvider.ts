import * as vscode from "vscode"
import {BocDecompilerProvider} from "./BocDecompilerProvider"

export class BocEditorProvider implements vscode.CustomReadonlyEditorProvider {
    public static register(): vscode.Disposable {
        return vscode.window.registerCustomEditorProvider("boc.editor", new BocEditorProvider(), {
            supportsMultipleEditorsPerDocument: false,
        })
    }

    public openCustomDocument(
        uri: vscode.Uri,
        _openContext: vscode.CustomDocumentOpenContext,
        _token: vscode.CancellationToken,
    ): {uri: vscode.Uri; dispose(): void} {
        return {
            uri,
            dispose: () => {},
        }
    }

    public async resolveCustomEditor(
        document: {uri: vscode.Uri},
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken,
    ): Promise<void> {
        const decompileUri = document.uri.with({
            scheme: BocDecompilerProvider.scheme,
            path: document.uri.path + ".decompiled.fif",
        })

        const doc = await vscode.workspace.openTextDocument(decompileUri)
        await vscode.window.showTextDocument(doc, {
            preview: true,
            viewColumn: vscode.ViewColumn.Active,
        })

        webviewPanel.dispose()
    }
}
