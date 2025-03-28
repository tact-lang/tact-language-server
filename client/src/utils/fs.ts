import * as vscode from "vscode"

export async function readFile(filePath: string): Promise<string> {
    const contentArray = await vscode.workspace.fs.readFile(vscode.Uri.parse(filePath))
    return Buffer.from(contentArray).toString("utf8")
}

export async function readFileRaw(filePath: string): Promise<Buffer> {
    const contentArray = await vscode.workspace.fs.readFile(vscode.Uri.parse(filePath))
    return Buffer.from(contentArray)
}

export async function writeFile(filePath: string, content: string): Promise<void> {
    await vscode.workspace.fs.writeFile(vscode.Uri.parse(filePath), Buffer.from(content))
}

export async function fileExists(filePath: string): Promise<boolean> {
    try {
        await vscode.workspace.fs.readFile(vscode.Uri.parse(filePath))
        return true
    } catch {
        return false
    }
}
