import * as vscode from "vscode"

export async function readFile(uri: vscode.Uri): Promise<string> {
    const contentArray = await vscode.workspace.fs.readFile(uri)
    return new TextDecoder().decode(contentArray)
}

export async function readFileRaw(filePath: string): Promise<Uint8Array> {
    return vscode.workspace.fs.readFile(vscode.Uri.parse(filePath))
}

export async function writeFile(filePath: string, content: string): Promise<void> {
    const encoder = new TextEncoder()
    await vscode.workspace.fs.writeFile(vscode.Uri.parse(filePath), encoder.encode(content))
}

export async function fileExists(uri: vscode.Uri): Promise<boolean> {
    try {
        await vscode.workspace.fs.readFile(uri)
        return true
    } catch {
        return false
    }
}
