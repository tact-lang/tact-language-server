import * as lsp from "vscode-languageserver"
import {File} from "@server/psi/File"
import {Contract, Field} from "@server/psi/Decls"
import {UnusedInspection} from "./UnusedInspection"
import {asLspRange} from "@server/utils/position"

export class MissedFieldInContractInspection extends UnusedInspection {
    protected checkFile(file: File, diagnostics: lsp.Diagnostic[]): void {
        file.getContracts().forEach(contract => {
            this.inspectContract(contract, diagnostics)
        })
    }

    private inspectContract(contract: Contract, diagnostics: lsp.Diagnostic[]) {
        const inheritedTraits = contract.inheritTraits()
        if (inheritedTraits.length === 0) return // nothing to check

        const fieldsToImplement = inheritedTraits.flatMap(it => it.ownFields())
        const contractFields = contract.ownFields()

        const contractFieldsMapping = new Map<string, Field>()
        contractFields.forEach(field => {
            contractFieldsMapping.set(field.name(), field)
        })

        fieldsToImplement.forEach(field => {
            if (contractFieldsMapping.has(field.name())) {
                return
            }

            const nameIdent = contract.nameIdentifier()
            const owner = field.owner()
            if (!nameIdent || !owner) return
            diagnostics.push({
                severity: lsp.DiagnosticSeverity.Error,
                range: asLspRange(nameIdent),
                message: `Contract \`${contract.name()}\` is missing \`${field.name()}\` field required by \`${owner.name()}\``,
                source: "tact",
                code: "missing-field",
            })
        })
    }
}
