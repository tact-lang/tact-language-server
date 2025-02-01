import * as lsp from "vscode-languageserver"
import {File} from "@server/psi/File"
import {Contract} from "@server/psi/Decls"
import {UnusedInspection} from "./UnusedInspection"
import {superConstant, superField} from "@server/search/implementations"

export class UnusedContractMembersInspection extends UnusedInspection {
    protected checkFile(file: File, diagnostics: lsp.Diagnostic[]): void {
        file.getContracts().forEach(contract => {
            this.inspectContract(contract, diagnostics)
        })
    }

    private inspectContract(contract: Contract, diagnostics: lsp.Diagnostic[]) {
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
    }
}
