import * as lsp from "vscode-languageserver"
import {File} from "../psi/File"
import {asLspRange} from "../utils/position"
import {RecursiveVisitor} from "../psi/RecursiveVisitor"

export class EmptyBlockInspection {
    inspect(file: File): lsp.Diagnostic[] {
        if (file.fromStdlib) return []
        const diagnostics: lsp.Diagnostic[] = []

        const blockTypes = new Set([
            "function_body",
            "receive_body",
            "bounced_body",
            "external_body",
            "init_body",
            "block_statement",
            "if_statement",
            "else_clause",
            "while_statement",
            "repeat_statement",
            "try_statement",
            "catch_clause",
            "foreach_statement",
        ])

        RecursiveVisitor.visit(file.rootNode, node => {
            if (blockTypes.has(node.type)) {
                const body = node.children.find(child => child.type === "block_statement")
                if (body && body.children.length <= 2) {
                    // only { and }
                    diagnostics.push({
                        severity: lsp.DiagnosticSeverity.Warning,
                        range: asLspRange(body.firstChild!),
                        message: "Empty code block",
                        source: "tact",
                        code: "empty-block",
                    })
                }
            }
        })

        return diagnostics
    }
}
