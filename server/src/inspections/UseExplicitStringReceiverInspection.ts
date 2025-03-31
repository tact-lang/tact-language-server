import * as lsp from "vscode-languageserver"
import type {File} from "@server/psi/File"
import {Inspection, InspectionIds} from "./Inspection"
import {asLspRange} from "@server/utils/position"
import {MessageFunction} from "@server/psi/Decls"
import {RecursiveVisitor} from "@server/psi/RecursiveVisitor"

export class UseExplicitStringReceiverInspection implements Inspection {
    public readonly id: "use-explicit-string-receiver" = InspectionIds.USE_EXPLICIT_STRING_RECEIVER

    public inspect(file: File): lsp.Diagnostic[] {
        if (file.fromStdlib) return []
        const diagnostics: lsp.Diagnostic[] = []
        this.checkFile(file, diagnostics)
        return diagnostics
    }

    protected checkFile(file: File, diagnostics: lsp.Diagnostic[]): void {
        if (file.fromStdlib) return

        const contracts = file.getContracts()
        for (const contract of contracts) {
            const functions = contract.messageFunctions()
            if (functions.length === 0) continue

            for (const f of functions) {
                if (!f.isStringFallback()) continue

                this.checkReceiver(f, diagnostics)
            }
        }
    }

    private checkReceiver(rec: MessageFunction, diagnostics: lsp.Diagnostic[]): void {
        const paramName = rec.parameterName()
        if (!paramName) return

        RecursiveVisitor.visit(rec.node, node => {
            // match:
            // if (PARAM_NAME == "string literal") { ... }
            if (node.type === "if_statement") {
                const condition = node.childForFieldName("condition")
                const body = node.childForFieldName("consequence")
                if (!condition || !body) return
                if (condition.type !== "binary_expression") return

                // msg == "mint"
                // |   |  |
                // |   |  right
                // |   operator
                // left
                const left = condition.childForFieldName("left")
                const operator = condition.childForFieldName("operator")
                const right = condition.childForFieldName("right")
                if (!left || !right || !operator) return
                if (operator.text !== "==") return

                if (left.text !== paramName) return

                if (right.type !== "string") return

                diagnostics.push({
                    severity: lsp.DiagnosticSeverity.Warning,
                    range: asLspRange(right),
                    message: `Consider using an explicit receiver for ${right.text} message`,
                    source: "tact",
                    code: "performance",
                })
            }
        })
    }
}
