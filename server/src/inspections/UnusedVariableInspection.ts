import * as lsp from "vscode-languageserver"
import {File} from "../psi/File"
import {UnusedInspection} from "./UnusedInspection"
import {RecursiveVisitor} from "../psi/RecursiveVisitor"

export class UnusedVariableInspection extends UnusedInspection {
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
