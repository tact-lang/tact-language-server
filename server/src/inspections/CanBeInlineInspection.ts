import * as lsp from "vscode-languageserver"
import type {File} from "@server/psi/File"
import {Inspection, InspectionIds} from "./Inspection"
import {asLspPosition, asLspRange} from "@server/utils/position"
import {Fun} from "@server/psi/Decls"
import {FileDiff} from "@server/utils/FileDiff"
import {Referent} from "@server/psi/Referent"

export class CanBeInlineInspection implements Inspection {
    public readonly id: "can-be-inline-function" = InspectionIds.CAN_BE_INLINE_FUNCTION

    public inspect(file: File): lsp.Diagnostic[] {
        if (file.fromStdlib) return []
        const diagnostics: lsp.Diagnostic[] = []
        this.checkFile(file, diagnostics)
        return diagnostics
    }

    protected checkFile(file: File, diagnostics: lsp.Diagnostic[]): void {
        if (file.fromStdlib) return

        const functions = file.getFuns()
        for (const f of functions) {
            if (!this.canBeInline(f)) continue
            this.warn(f, diagnostics, file)
        }

        const contracts = file.getContracts()
        for (const contract of contracts) {
            const functions = contract.ownMethods()
            for (const f of functions) {
                if (!this.canBeInline(f)) continue
                this.warn(f, diagnostics, file)
            }
        }
    }

    private warn(f: Fun, diagnostics: lsp.Diagnostic[], file: File): void {
        const nameNode = f.nameIdentifier()
        if (!nameNode) return

        diagnostics.push({
            severity: lsp.DiagnosticSeverity.Warning,
            range: asLspRange(nameNode),
            message: `The function used only once, add \`inline\` modifier for better performance`,
            source: "tact",
            code: "performance",
            data: this.rewriteAsInline(f, file),
        })
    }

    private canBeInline(fun: Fun): boolean {
        const body = fun.body
        if (!body) {
            return false
        }

        if (
            fun.isGetMethod ||
            fun.isNative() ||
            fun.isAbstract() ||
            fun.isVirtual() ||
            fun.isAsm() ||
            fun.isInline()
        ) {
            return false
        }

        return this.usedOnce(fun)
    }

    private rewriteAsInline(method: Fun, file: File): undefined | lsp.CodeAction {
        const diff = FileDiff.forFile(file.uri)

        diff.appendTo(asLspPosition(method.node.startPosition), "inline ")

        const edit = diff.toWorkspaceEdit()
        return {
            edit,
            title: `Add \`inline\` modifier`,
            isPreferred: true,
        }
    }

    private usedOnce(fun: Fun): boolean {
        const methodNameIdent = fun.nameIdentifier()
        if (!methodNameIdent) return false
        const ref = new Referent(methodNameIdent, fun.file)
        // length = 0: no references
        // length = 1: single reference
        // length = 2: 2 or more references
        const references = ref.findReferences({includeDefinition: false, limit: 2})
        return references.length === 1
    }
}
