import * as lsp from "vscode-languageserver"
import type {File} from "@server/psi/File"
import {Inspection, InspectionIds} from "./Inspection"
import {asLspPosition, asLspRange} from "@server/utils/position"
import {Contract, Fun} from "@server/psi/Decls"
import {FileDiff} from "@server/utils/FileDiff"
import {RecursiveVisitor} from "@server/psi/RecursiveVisitor"
import {Referent} from "@server/psi/Referent"
import {Node} from "@server/psi/Node"

export class CanBeStandaloneFunctionInspection implements Inspection {
    public readonly id: "can-be-standalone-function" = InspectionIds.CAN_BE_STANDALONE_FUNCTION

    public inspect(file: File): lsp.Diagnostic[] {
        if (file.fromStdlib) return []
        const diagnostics: lsp.Diagnostic[] = []
        this.checkFile(file, diagnostics)
        return diagnostics
    }

    protected checkFile(file: File, diagnostics: lsp.Diagnostic[]): void {
        if (file.fromStdlib) return

        const contracts = file.getContracts()
        for (const contract of contracts) {
            const functions = contract.ownMethods()
            if (functions.length === 0) continue

            for (const f of functions) {
                if (!this.canBeStandalone(f)) continue
                const nameNode = f.nameIdentifier()
                if (!nameNode) continue

                diagnostics.push({
                    severity: lsp.DiagnosticSeverity.Warning,
                    range: asLspRange(nameNode),
                    message: `The function does not use contract state, extract it into a standalone function for better performance`,
                    source: "tact",
                    code: "performance",
                    data: this.rewriteAsStandalone(contract, f, file),
                })
            }
        }
    }

    private canBeStandalone(fun: Fun): boolean {
        const body = fun.body
        if (!body) {
            return false
        }

        if (fun.isGetMethod) {
            return false
        }

        let emptyFunction = true
        let usesSelf = false
        RecursiveVisitor.visit(body, node => {
            if (node.type === "self" || (node.type === "identifier" && node.text === "self")) {
                usesSelf = true
            }
            if (node.type === "identifier") {
                emptyFunction = false
            }
        })

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        return !usesSelf && !emptyFunction
    }

    private rewriteAsStandalone(
        contract: Contract,
        method: Fun,
        file: File,
    ): undefined | lsp.CodeAction {
        const diff = FileDiff.forFile(file.uri)

        diff.replace(asLspRange(method.node), "")

        const funText = this.removeExtraIndentation(method.node.text)
        diff.appendTo(asLspPosition(contract.node.endPosition), "\n\n" + funText)

        const usages = this.collectUsages(method, file)
        for (const usage of usages) {
            // Rewrite usages like `self.bar()` to just `bar()`
            const parent = usage.node.parent
            if (parent?.type === "method_call_expression") {
                const args = parent.childForFieldName("arguments")
                if (!args) continue

                diff.replace(asLspRange(parent), method.name() + args.text)
            }
        }

        const edit = diff.toWorkspaceEdit()
        return {
            edit,
            title: `Extract to standalone function`,
            isPreferred: true,
        }
    }

    private collectUsages(method: Fun, file: File): Node[] {
        const methodNameIdent = method.nameIdentifier()
        if (!methodNameIdent) return []
        const ref = new Referent(methodNameIdent, file)
        return ref.findReferences(false)
    }

    private removeExtraIndentation(text: string): string {
        const lines = text.split("\n")

        const minIndent = lines
            .slice(1)
            .filter(line => line.trim().length > 0)
            .reduce((min, line) => {
                const match = /^\s*/.exec(line)
                if (!match) return 0
                const indent = match[0].length
                return Math.min(min, indent)
            }, Infinity)

        return lines
            .map((line, index) => (index === 0 ? line : line.slice(minIndent)))
            .join("\n")
            .trim()
    }
}
