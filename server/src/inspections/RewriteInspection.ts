import * as lsp from "vscode-languageserver"
import type {File} from "@server/psi/File"
import {asLspRange} from "@server/utils/position"
import {RecursiveVisitor} from "@server/psi/RecursiveVisitor"
import {Inspection, InspectionIds} from "./Inspection"
import {Node as SyntaxNode} from "web-tree-sitter"
import {FileDiff} from "@server/utils/FileDiff"

export class RewriteInspection implements Inspection {
    public readonly id: "rewrite" = InspectionIds.REWRITE

    public inspect(file: File): lsp.Diagnostic[] {
        if (file.fromStdlib) return []
        const diagnostics: lsp.Diagnostic[] = []

        RecursiveVisitor.visit(file.rootNode, node => {
            if (this.isContextSender(node)) {
                diagnostics.push({
                    severity: lsp.DiagnosticSeverity.Information,
                    range: asLspRange(node),
                    message: "Can be rewritten as more efficient `sender()`",
                    source: "tact",
                    code: "performance",
                    data: this.rewriteContextSender(node, file),
                })
            }
        })

        return diagnostics
    }

    /**
     * Check for `context().sender`.
     */
    private isContextSender(node: SyntaxNode): boolean {
        if (node.type !== "field_access_expression") return false

        const left = node.childForFieldName("object")
        const right = node.childForFieldName("name")

        if (!left || !right) return false

        if (right.text !== "sender") return false
        if (left.type !== "static_call_expression") return false

        const callName = left.childForFieldName("name")
        return callName?.text === "context"
    }

    private rewriteContextSender(node: SyntaxNode, file: File): lsp.CodeAction {
        const diff = FileDiff.forFile(file.uri)
        diff.replace(asLspRange(node), "sender()")
        const edit = diff.toWorkspaceEdit()
        return {
            edit,
            title: "Rewrite as `sender()`",
            isPreferred: true,
        }
    }
}
