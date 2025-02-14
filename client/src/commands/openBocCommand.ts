import * as vscode from "vscode"
import {BocDecompilerProvider} from "../providers/BocDecompilerProvider"

export function registerOpenBocCommand(_context: vscode.ExtensionContext) {
    return vscode.commands.registerCommand("tact.openBocFile", async (fileUri: vscode.Uri) => {
        try {
            if (!fileUri) {
                // Если команда вызвана без URI, показываем диалог выбора файла
                const files = await vscode.window.showOpenDialog({
                    canSelectFiles: true,
                    canSelectFolders: false,
                    canSelectMany: false,
                    filters: {
                        "BOC files": ["boc"],
                    },
                })
                if (!files || files.length === 0) {
                    return
                }
                fileUri = files[0]
            }

            // Создаем URI для декомпилированного представления
            const decompileUri = fileUri.with({
                scheme: BocDecompilerProvider.scheme,
                path: fileUri.path + ".decompiled.fif",
            })

            // Открываем декомпилированный файл
            const doc = await vscode.workspace.openTextDocument(decompileUri)
            await vscode.window.showTextDocument(doc, {
                preview: true,
                viewColumn: vscode.ViewColumn.Active,
            })
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open BOC file: ${error}`)
        }
    })
}
