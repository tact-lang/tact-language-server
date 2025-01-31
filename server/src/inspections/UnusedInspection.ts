import * as lsp from "vscode-languageserver"
import {File} from "@server/psi/File"
import {asLspRange} from "@server/utils/position"
import {Referent} from "@server/psi/Referent"
import {SyntaxNode} from "web-tree-sitter"
import {Logger} from "@server/utils/logger"

export abstract class UnusedInspection {
    inspect(file: File): lsp.Diagnostic[] {
        if (file.fromStdlib) return []
        const diagnostics: lsp.Diagnostic[] = []
        this.checkFile(file, diagnostics)
        return diagnostics
    }

    protected abstract checkFile(file: File, diagnostics: lsp.Diagnostic[]): void

    protected checkUnused(
        node: SyntaxNode,
        file: File,
        diagnostics: lsp.Diagnostic[],
        options: {
            kind: string
            severity?: lsp.DiagnosticSeverity
            code?: string
            rangeNode?: SyntaxNode
        },
    ) {
        const references = new Referent(node, file).findReferences()
        if (references.length === 0) {
            const range = asLspRange(options.rangeNode || node)

            diagnostics.push({
                severity: options.severity || lsp.DiagnosticSeverity.Hint,
                range,
                message: `${options.kind} '${node.text}' is never used`,
                source: "tact",
                code: options.code || "unused",
                tags: [lsp.DiagnosticTag.Unnecessary],
            })

            Logger.getInstance().info(`Found unused ${options.kind.toLowerCase()} '${node.text}'`)
        }
    }
}
