//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type * as lsp from "vscode-languageserver"
import type {TactFile} from "@server/languages/tact/psi/TactFile"
import type {Contract} from "@server/languages/tact/psi/Decls"
import {UnusedInspection} from "./UnusedInspection"
import {superConstant, superField, superMethod} from "@server/languages/tact/search/implementations"
import {Inspection, InspectionIds} from "./Inspection"

export class UnusedContractMembersInspection extends UnusedInspection implements Inspection {
    public readonly id: "unused-contract-members" = InspectionIds.UNUSED_CONTRACT_MEMBERS

    protected checkFile(file: TactFile, diagnostics: lsp.Diagnostic[]): void {
        file.getContracts().forEach(contract => {
            this.inspectContract(contract, diagnostics)
        })
    }

    private inspectContract(contract: Contract, diagnostics: lsp.Diagnostic[]): void {
        contract.ownFields().forEach(field => {
            const nameIdent = field.nameIdentifier()
            if (!nameIdent) return

            this.checkUnused(nameIdent, contract.file, diagnostics, {
                kind: "Field",
                code: "unused-field",
                rangeNode: nameIdent,
                skipIf: () => superField(field) !== null,
            })
        })

        contract.ownConstants().forEach(constant => {
            const nameIdent = constant.nameIdentifier()
            if (!nameIdent) return

            this.checkUnused(nameIdent, contract.file, diagnostics, {
                kind: "Constant",
                code: "unused-constant",
                rangeNode: nameIdent,
                skipIf: () => superConstant(constant) !== null,
            })
        })

        contract.ownMethods().forEach(method => {
            if (method.isGetMethod) return // get methods are always used

            const nameIdent = method.nameIdentifier()
            if (!nameIdent) return

            this.checkUnused(nameIdent, contract.file, diagnostics, {
                kind: "Method",
                code: "unused-method",
                rangeNode: nameIdent,
                skipIf: () => superMethod(method) !== null,
            })
        })
    }
}
