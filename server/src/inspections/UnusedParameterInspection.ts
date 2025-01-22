import * as lsp from "vscode-languageserver"
import {SyntaxNode} from "web-tree-sitter"
import {File} from "../psi/File"
import {asLspRange} from "../utils/position"
import {Fun} from "../psi/TopLevelDeclarations"
import {Logger} from "../utils/logger"
import {Referent} from "../psi/Referent"
import {Node} from "../psi/Node"

export class UnusedParameterInspection {
    inspect(file: File): lsp.Diagnostic[] {
        if (file.fromStdlib) return []

        const diagnostics: lsp.Diagnostic[] = []

        file.getFuns().forEach(fun => {
            this.inspectFunction(fun, diagnostics)
        })

        file.getContracts().forEach(contract => {
            contract.ownMethods().forEach(method => {
                this.inspectFunction(method, diagnostics)
            })
        })

        file.getTraits().forEach(trait => {
            trait.ownMethods().forEach(method => {
                this.inspectFunction(method, diagnostics)
            })
        })

        return diagnostics
    }

    private inspectFunction(fun: Fun, diagnostics: lsp.Diagnostic[]) {
        if (!fun.hasBody()) return
        const parameters = fun.parameters()
        if (!parameters) return

        parameters.forEach(param => {
            const paramName = param.name()
            const references = this.findUsages(param.node, fun.file)

            if (references.length === 0) {
                const nameIdent = param.nameIdentifier()
                if (!nameIdent) return

                diagnostics.push({
                    severity: lsp.DiagnosticSeverity.Warning,
                    range: asLspRange(nameIdent),
                    message: `Parameter '${paramName}' is never used`,
                    source: "tact",
                    code: "unused-parameter",
                    tags: [lsp.DiagnosticTag.Unnecessary],
                })

                Logger.getInstance().info(
                    `Found unused parameter '${paramName}' in function '${fun.name()}'`,
                )
            }
        })
    }

    private findUsages(param: SyntaxNode, file: File): Node[] {
        return new Referent(param, file).findReferences()
    }
}
