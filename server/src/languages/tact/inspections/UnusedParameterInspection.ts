//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type * as lsp from "vscode-languageserver"
import type {TactFile} from "@server/languages/tact/psi/TactFile"
import type {Fun} from "@server/languages/tact/psi/Decls"
import {UnusedInspection} from "./UnusedInspection"
import {Inspection, InspectionIds} from "./Inspection"

export class UnusedParameterInspection extends UnusedInspection implements Inspection {
    public readonly id: "unused-parameter" = InspectionIds.UNUSED_PARAMETER

    protected checkFile(file: TactFile, diagnostics: lsp.Diagnostic[]): void {
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

    private inspectFunction(fun: Fun, diagnostics: lsp.Diagnostic[]): void {
        if (!fun.hasBody()) return
        const parameters = fun.parameters()

        parameters.forEach(param => {
            const nameIdent = param.nameIdentifier()
            if (!nameIdent) return

            this.checkUnused(param.nameIdentifier(), fun.file, diagnostics, {
                kind: "Parameter",
                code: "unused-parameter",
                rangeNode: nameIdent,
            })
        })
    }
}
