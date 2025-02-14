import * as vscode from "vscode"
import {AssemblyWriter, disassembleRoot, debugSymbols, Cell} from "tvm-dec"
import {readFileSync} from "fs"

export class BocDecompilerProvider implements vscode.TextDocumentContentProvider {
    private _onDidChange = new vscode.EventEmitter<vscode.Uri>()
    readonly onDidChange = this._onDidChange.event

    static scheme = "boc-decompiled"

    private decompileCache = new Map<string, string>()

    async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
        const bocPath = this.getBocPath(uri)

        try {
            if (this.decompileCache.has(bocPath)) {
                return this.decompileCache.get(bocPath)!
            }

            const decompiled = await this.decompileBoc(bocPath)
            this.decompileCache.set(bocPath, decompiled)
            return decompiled
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            return this.formatError(errorMessage)
        }
    }

    private getBocPath(uri: vscode.Uri): string {
        return uri.fsPath.replace(".decompiled.fif", "")
    }

    private async decompileBoc(bocPath: string): Promise<string> {
        try {
            const content = readFileSync(bocPath).toString("base64")
            const cell = Cell.fromBase64(content)
            const program = disassembleRoot(cell, {
                computeRefs: true,
            })

            const output = AssemblyWriter.write(program, {
                useAliases: true,
                debugSymbols: debugSymbols,
            })

            return this.formatDecompiledOutput(output)
        } catch (error) {
            throw new Error(`Decompilation failed: ${error}`)
        }
    }

    private formatDecompiledOutput(output: string): string {
        const header = [
            "// Decompiled BOC file",
            "// Note: This is auto-generated code",
            "// Time: " + new Date().toISOString(),
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

    // Метод для обновления содержимого
    public update(uri: vscode.Uri) {
        this._onDidChange.fire(uri)
        this.decompileCache.delete(this.getBocPath(uri))
    }
}
