import * as lsp from "vscode-languageserver"
import {File} from "../psi/File"
import {Fun} from "../psi/Decls"
import {UnusedInspection} from "./UnusedInspection"

export class UnusedParameterInspection extends UnusedInspection {
    protected checkFile(file: File, diagnostics: lsp.Diagnostic[]): void {
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
    }

    private inspectFunction(fun: Fun, diagnostics: lsp.Diagnostic[]) {
        if (!fun.hasBody()) return
        const parameters = fun.parameters()
        if (!parameters) return

        parameters.forEach(param => {
            const nameIdent = param.nameIdentifier()
            if (!nameIdent) return

            this.checkUnused(param.node, fun.file, diagnostics, {
                kind: "Parameter",
                code: "unused-parameter",
                rangeNode: nameIdent,
            })
        })
    }
}
