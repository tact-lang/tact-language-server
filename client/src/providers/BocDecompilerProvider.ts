import * as vscode from "vscode"
import {AssemblyWriter, disassembleRoot, debugSymbols, Cell} from "@tact-lang/opcode"
import {readFileSync} from "node:fs"

export class BocDecompilerProvider implements vscode.TextDocumentContentProvider {
    private readonly _onDidChange: vscode.EventEmitter<vscode.Uri> = new vscode.EventEmitter()
    public readonly onDidChange: vscode.Event<vscode.Uri> = this._onDidChange.event

    public static scheme: string = "boc-decompiled"

    private readonly decompileCache: Map<string, string> = new Map()

    public provideTextDocumentContent(uri: vscode.Uri): string {
        const bocPath = this.getBocPath(uri)

        try {
            const cached = this.decompileCache.get(bocPath)
            if (cached) {
                return cached
            }

            const decompiled = this.decompileBoc(bocPath)
            this.decompileCache.set(bocPath, decompiled)
            return decompiled
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            return this.formatError(errorMessage)
        }
    }

    private getBocPath(uri: vscode.Uri): string {
        console.log("Original URI:", uri.toString())
        const bocPath = uri.fsPath.replace(".decompiled.fif", "")
        console.log("BOC path:", bocPath)
        return bocPath
    }

    private decompileBoc(bocPath: string): string {
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
        } catch (error: unknown) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
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
    public update(uri: vscode.Uri): void {
        this._onDidChange.fire(uri)
        this.decompileCache.delete(this.getBocPath(uri))
    }
}
