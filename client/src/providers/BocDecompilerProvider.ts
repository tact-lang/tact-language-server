import * as vscode from "vscode"
import * as fs from "../utils/fs"
import {AssemblyWriter, Cell, debugSymbols, disassembleRoot} from "@tact-lang/opcode"

export class BocDecompilerProvider implements vscode.TextDocumentContentProvider {
    private readonly _onDidChange: vscode.EventEmitter<vscode.Uri> = new vscode.EventEmitter()
    public readonly onDidChange: vscode.Event<vscode.Uri> = this._onDidChange.event

    public static scheme: string = "boc-decompiled"

    public async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
        const bocPath = this.getBocPath(uri)

        try {
            return await this.decompileBoc(bocPath)
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

    private async decompileBoc(bocPath: string): Promise<string> {
        try {
            const content = await fs.readFileRaw(bocPath)
            const cell = Cell.fromBase64(content.toString("base64"))
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
}
