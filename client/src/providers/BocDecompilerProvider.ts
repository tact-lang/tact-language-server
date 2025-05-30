//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import * as vscode from "vscode"
import {AssemblyWriter, Cell, debugSymbols, disassembleRoot} from "@tact-lang/opcode"

export class BocDecompilerProvider implements vscode.TextDocumentContentProvider {
    private readonly _onDidChange: vscode.EventEmitter<vscode.Uri> = new vscode.EventEmitter()
    public readonly onDidChange: vscode.Event<vscode.Uri> = this._onDidChange.event

    private readonly lastModified: Map<vscode.Uri, Date> = new Map()

    public static scheme: string = "boc-decompiled"

    public async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
        const bocUri = this.getBocPath(uri)

        try {
            return await this.decompileBoc(bocUri)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            return this.formatError(errorMessage)
        }
    }

    private getBocPath(uri: vscode.Uri): vscode.Uri {
        console.log("Original URI:", uri.toString())
        const bocPath = uri.fsPath.replace(".decompiled.fif", "")
        console.log("BOC path:", bocPath)
        return vscode.Uri.file(bocPath)
    }

    private async decompileBoc(bocUri: vscode.Uri): Promise<string> {
        try {
            const rawContent = await vscode.workspace.fs.readFile(bocUri)
            const content = Buffer.from(rawContent).toString("base64")
            const cell = Cell.fromBase64(content)
            const program = disassembleRoot(cell, {
                computeRefs: true,
            })

            const output = AssemblyWriter.write(program, {
                useAliases: true,
                debugSymbols: debugSymbols,
            })

            return this.formatDecompiledOutput(output, bocUri)
        } catch (error: unknown) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new Error(`Decompilation failed: ${error}`)
        }
    }

    private formatDecompiledOutput(output: string, bocUri: vscode.Uri): string {
        const header = [
            "// Decompiled BOC file",
            "// Note: This is auto-generated code",
            `// Time: ${new Date().toISOString()}`,
            `// Source: ${bocUri.fsPath}`,
            "",
            "",
        ].join("\n")

        return header + output
    }

    private formatError(error: string): string {
        return [
            "// Failed to decompile BOC file",
            "// Error: " + error,
            "// Time: " + new Date().toISOString(),
        ].join("\n")
    }

    public update(uri: vscode.Uri): void {
        const bocUri = this.getBocPath(uri)
        this.lastModified.set(bocUri, new Date())
        this._onDidChange.fire(uri)
    }
}
