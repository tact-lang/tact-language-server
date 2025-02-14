import * as vscode from "vscode"
import {BocDecompilerProvider} from "./BocDecompilerProvider"

export class BocEditorProvider implements vscode.CustomReadonlyEditorProvider {
    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        return vscode.window.registerCustomEditorProvider(
            "boc.editor",
            new BocEditorProvider(context),
            {
                supportsMultipleEditorsPerDocument: false,
            },
        )
    }

    constructor(private readonly context: vscode.ExtensionContext) {}

    async openCustomDocument(
        uri: vscode.Uri,
        _openContext: vscode.CustomDocumentOpenContext,
        _token: vscode.CancellationToken,
    ): Promise<{uri: vscode.Uri; dispose(): void}> {
        return {
            uri,
            dispose: () => {},
        }
    }

    async resolveCustomEditor(
        document: {uri: vscode.Uri},
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken,
    ): Promise<void> {
        // Создаем URI для декомпилированного представления
        const decompileUri = document.uri.with({
            scheme: BocDecompilerProvider.scheme,
            path: document.uri.path + ".decompiled.fif",
        })

        // Открываем декомпилированный файл
        const doc = await vscode.workspace.openTextDocument(decompileUri)
        await vscode.window.showTextDocument(doc, {
            preview: true,
            viewColumn: vscode.ViewColumn.Active,
        })

        // Закрываем панель webview, так как мы открыли текстовый редактор
        webviewPanel.dispose()
    }
}
