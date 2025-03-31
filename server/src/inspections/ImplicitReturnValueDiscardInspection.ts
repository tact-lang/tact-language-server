import * as lsp from "vscode-languageserver"
import type {File} from "@server/psi/File"
import {Inspection, InspectionIds} from "./Inspection"
import {asLspPosition, asLspRange} from "@server/utils/position"
import {Fun} from "@server/psi/Decls"
import {RecursiveVisitor} from "@server/psi/RecursiveVisitor"
import {CallLike} from "@server/psi/Node"
import {Reference} from "@server/psi/Reference"
import {FileDiff} from "@server/utils/FileDiff"

export class ImplicitReturnValueDiscardInspection implements Inspection {
    public readonly id: "implicit-return-value-discard" =
        InspectionIds.IMPLICIT_RETURN_VALUE_DISCARD

    public inspect(file: File): lsp.Diagnostic[] {
        if (file.fromStdlib) return []
        const diagnostics: lsp.Diagnostic[] = []
        this.checkFile(file, diagnostics)
        return diagnostics
    }

    protected checkFile(file: File, diagnostics: lsp.Diagnostic[]): void {
        if (file.fromStdlib) return

        RecursiveVisitor.visit(file.rootNode, node => {
            if (node.type === "static_call_expression" || node.type === "method_call_expression") {
                const parent = node.parent
                if (parent?.type !== "expression_statement") return

                const call = new CallLike(node, file)
                const nameNode = call.nameNode()
                if (!nameNode) return

                const called = Reference.resolve(nameNode)
                if (!(called instanceof Fun)) return

                const returnType = called.returnType()
                if (!returnType) return // no return type, no problems

                diagnostics.push({
                    severity: lsp.DiagnosticSeverity.Warning,
                    range: asLspRange(nameNode.node),
                    message: `Return value of the function call is not used, if you don't need the value, add \`let _ = ...\``,
                    source: "tact",
                    data: this.appendExplicitDiscard(call, file),
                })
            }
        })
    }

    private appendExplicitDiscard(call: CallLike, file: File): undefined | lsp.CodeAction {
        const diff = FileDiff.forFile(file.uri)

        diff.appendTo(asLspPosition(call.node.startPosition), "let _ = ")

        const edit = diff.toWorkspaceEdit()
        return {
            edit,
            title: `Add explicit \`let _ = \` to discard the value`,
            isPreferred: true,
        }
    }
}
