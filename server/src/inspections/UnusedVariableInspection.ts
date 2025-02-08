import * as lsp from "vscode-languageserver"
import {File} from "@server/psi/File"
import {UnusedInspection} from "./UnusedInspection"
import {RecursiveVisitor} from "@server/psi/RecursiveVisitor"
import {Inspection, InspectionIds} from "./Inspection"

export class UnusedVariableInspection extends UnusedInspection implements Inspection {
    readonly id: "unused-variable" = InspectionIds.UNUSED_VARIABLE

    protected checkFile(file: File, diagnostics: lsp.Diagnostic[]): void {
        RecursiveVisitor.visit(file.rootNode, node => {
            if (node.type !== "let_statement") {
                return
            }

            const nameNode = node.childForFieldName("name")
            if (!nameNode) return
            this.checkUnused(nameNode, file, diagnostics, {
                kind: "Variable",
                code: "unused-variable",
            })
        })
    }
}
