import * as lsp from "vscode-languageserver"
import type {File} from "@server/psi/File"
import {Contract, type Field, Fun, Trait} from "@server/psi/Decls"
import {asLspRange} from "@server/utils/position"
import {Inspection, InspectionIds} from "./Inspection"
import {FileDiff} from "@server/utils/FileDiff"

export class MissedMembersInContractInspection implements Inspection {
    public readonly id: "missed-members-in-contract" = InspectionIds.MISSED_METHOD_IN_CONTRACT

    public inspect(file: File): lsp.Diagnostic[] {
        if (file.fromStdlib) return []
        const diagnostics: lsp.Diagnostic[] = []
        this.checkFile(file, diagnostics)
        return diagnostics
    }

    protected checkFile(file: File, diagnostics: lsp.Diagnostic[]): void {
        for (const contract of file.getContracts()) {
            this.inspectContract(contract, diagnostics)
        }
    }

    private inspectContract(contract: Contract, diagnostics: lsp.Diagnostic[]): void {
        const inheritedTraits = contract.inheritTraits()
        if (inheritedTraits.length === 0) return // nothing to check

        const notImplementedMethods = this.findNotImplementedMethods(inheritedTraits, contract)
        const notImplementedFields = this.findNotImplementedFields(inheritedTraits, contract)

        if (notImplementedMethods.size === 0 && notImplementedFields.size === 0) return // nothing to implement

        const notImplementedMembers = [
            ...notImplementedFields.values(),
            ...notImplementedMethods.values(),
        ]

        const message = this.generateMessage(notImplementedMembers, contract)

        const nameIdent = contract.nameIdentifier()
        if (!nameIdent) return

        diagnostics.push({
            severity: lsp.DiagnosticSeverity.Error,
            range: asLspRange(nameIdent),
            message: message,
            source: "tact",
            code: "missing-member",
            data: implementTrait(
                contract,
                notImplementedFields,
                notImplementedMethods,
                contract.file,
            ),
        })
    }

    private findNotImplementedFields(
        inheritedTraits: Trait[],
        contract: Contract,
    ): Map<string, Field> {
        const fieldsToImplement = inheritedTraits.flatMap(it => it.fields())
        const contractFields = contract.ownFields()

        const contractFieldsMapping: Map<string, Field> = new Map()
        for (const field of contractFields) {
            contractFieldsMapping.set(field.name(), field)
        }

        const notImplementedFields: Map<string, Field> = new Map()
        for (const field of fieldsToImplement) {
            if (contractFieldsMapping.has(field.name())) {
                continue
            }
            notImplementedFields.set(field.name(), field)
        }
        return notImplementedFields
    }

    private findNotImplementedMethods(
        inheritedTraits: Trait[],
        contract: Contract,
    ): Map<string, Fun> {
        const methodsToImplement = inheritedTraits.flatMap(it =>
            it.methods().filter(it => it.isAbstract()),
        )
        const contractMethods = contract.methods().filter(it => !it.isAbstract())

        const contractMethodsMapping: Map<string, Fun> = new Map()
        for (const method of contractMethods) {
            contractMethodsMapping.set(method.name(), method)
        }

        const notImplementedMethods: Map<string, Fun> = new Map()
        for (const method of methodsToImplement) {
            if (contractMethodsMapping.has(method.name())) {
                continue
            }
            notImplementedMethods.set(method.name(), method)
        }
        return notImplementedMethods
    }

    private generateMessage(notImplementedMembers: (Fun | Field)[], contract: Contract): string {
        if (notImplementedMembers.length === 1) {
            const method = notImplementedMembers[0]
            const owner = method.owner()

            return `Contract \`${contract.name()}\` is missing \`${method.name()}\` method required by \`${owner?.name()}\``
        }

        const members = [...notImplementedMembers.values()]
            .map(member => {
                const owner = member.owner()
                const kind = member instanceof Fun ? "method" : "field"
                return `\n - \`${member.name()}\` ${kind} required by \`${owner?.name()}\``
            })
            .join("")
        return `Contract \`${contract.name()}\` is missing ${members}`
    }
}

function implementTrait(
    contract: Contract,
    notImplementedFields: Map<string, Field>,
    notImplementedMethods: Map<string, Fun>,
    file: File,
): undefined | lsp.CodeAction {
    const diff = FileDiff.forFile(file.uri)

    const insertText: string[] = []

    for (const [, field] of notImplementedFields) {
        const type = field.typeNode()?.type()?.qualifiedName() ?? "unknown"
        insertText.push(`    ${field.name()}: ${type};`)
    }

    if (notImplementedFields.size > 0 && notImplementedFields.size > 0) {
        insertText.push(``)
    }

    for (const [, method] of notImplementedMethods) {
        insertText.push(`    override fun ${method.name()}${method.signaturePresentation()} {}`)
    }

    const line = contract.nameIdentifier()?.startPosition.row
    if (line === undefined) return undefined

    diff.appendAsNextLine(line, insertText.join("\n"))

    const edit = diff.toWorkspaceEdit()
    return {
        edit,
        title: `Implement missed members`,
        isPreferred: true,
    }
}
