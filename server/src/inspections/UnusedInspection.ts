import * as lsp from "vscode-languageserver"
import type {File} from "@server/psi/File"
import {asLspRange} from "@server/utils/position"
import {Referent} from "@server/psi/Referent"
import type {Node as SyntaxNode} from "web-tree-sitter"

export abstract class UnusedInspection {
    public inspect(file: File): lsp.Diagnostic[] {
        if (file.fromStdlib) return []
        const diagnostics: lsp.Diagnostic[] = []
        this.checkFile(file, diagnostics)
        return diagnostics
    }

    protected abstract checkFile(file: File, diagnostics: lsp.Diagnostic[]): void

    protected checkUnused(
        node: SyntaxNode | null,
        file: File,
        diagnostics: lsp.Diagnostic[],
        options: {
            kind: string
            severity?: lsp.DiagnosticSeverity
            code?: string
            rangeNode?: SyntaxNode
            skipIf?: () => boolean
        },
    ): void {
        if (!node || node.text === "_") return

        const references = new Referent(node, file).findReferences()
        if (references.length === 0) {
            const range = asLspRange(options.rangeNode ?? node)

            if (options.skipIf && options.skipIf()) {
                return
            }

            diagnostics.push({
                severity: options.severity ?? lsp.DiagnosticSeverity.Hint,
                range,
                message: `${options.kind} '${node.text}' is never used`,
                source: "tact",
                code: options.code ?? "unused",
                tags: [lsp.DiagnosticTag.Unnecessary],
            })

            console.info(`Found unused ${options.kind.toLowerCase()} '${node.text}'`)
        }
    }
}
