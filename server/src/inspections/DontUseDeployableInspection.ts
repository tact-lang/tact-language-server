import * as lsp from "vscode-languageserver"
import type {File} from "@server/psi/File"
import {UnusedInspection} from "./UnusedInspection"
import {Inspection, InspectionIds} from "./Inspection"
import {asLspRange} from "@server/utils/position"
import {NamedNode} from "@server/psi/Node"
import {FileDiff} from "@server/utils/FileDiff"
import {Contract} from "@server/psi/Decls"
import {toolchain} from "@server/toolchain"

export class DontUseDeployableInspection extends UnusedInspection implements Inspection {
    public readonly id: "dont-use-deployable" = InspectionIds.DONT_USE_DEPLOYABLE

    protected checkFile(file: File, diagnostics: lsp.Diagnostic[]): void {
        if (file.fromStdlib) return
        if (!toolchain.isTact16()) return

        const contracts = file.getContracts()
        for (const contract of contracts) {
            const inheritedTraits = contract.inheritTraitsList()
            if (inheritedTraits.length === 0) continue

            const deployable = inheritedTraits.find(t => t.name() === "Deployable")
            if (!deployable) continue

            diagnostics.push({
                severity: lsp.DiagnosticSeverity.Warning,
                range: asLspRange(deployable.node),
                message: `Prefer empty receiver with cashback over Deployable trait for better performance`,
                source: "tact",
                code: "performance",
                data: this.rewriteDeployableWithEmptyReceiver(
                    contract,
                    deployable,
                    inheritedTraits,
                    file,
                ),
            })
        }
    }

    private rewriteDeployableWithEmptyReceiver(
        contract: Contract,
        deployableNode: NamedNode,
        inheritedTraits: NamedNode[],
        file: File,
    ): undefined | lsp.CodeAction {
        const diff = FileDiff.forFile(file.uri)

        if (inheritedTraits.length === 1) {
            const withClause = deployableNode.node.parent
            if (!withClause || withClause.type !== "trait_list") return undefined

            const range = asLspRange(withClause)
            diff.replace(
                {
                    ...range,
                    start: {
                        line: range.start.line,
                        character: range.start.character - 1, // space before
                    },
                },
                "",
            )
        } else {
            const range = asLspRange(deployableNode.node)
            diff.replace(
                {
                    ...range,
                    start: {
                        line: range.start.line,
                        character: range.start.character - 1, // space before
                    },
                },
                "",
            )

            const prevSibling = deployableNode.node.previousSibling
            if (prevSibling?.text === ",") {
                diff.replace(asLspRange(prevSibling), "")
            }
            const nextSibling = deployableNode.node.nextSibling
            if (nextSibling?.text === "," && prevSibling?.text !== ",") {
                diff.replace(asLspRange(nextSibling), "")
            }
        }

        const functions = contract.messageFunctions()
        const hasEmptyReceiverFunction = functions.some(it => it.nameLike() === "receive()")

        if (!hasEmptyReceiverFunction) {
            const positionToInsert = contract.positionForReceiver()
            if (positionToInsert) {
                diff.appendAsNextLine(
                    positionToInsert.line,
                    `
    receive() {
        cashback(sender());
    }`,
                )
            }
        }

        const edit = diff.toWorkspaceEdit()
        return {
            edit,
            title: `Rewrite with empty receiver with cashback`,
            isPreferred: true,
        }
    }
}
