//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import * as lsp from "vscode-languageserver"
import type {File} from "@server/languages/tact/psi/File"
import {Inspection, InspectionIds} from "./Inspection"
import {asLspRange} from "@server/utils/position"
import {FileDiff} from "@server/utils/FileDiff"
import {RecursiveVisitor} from "@server/languages/tact/psi/RecursiveVisitor"
import {CallLike} from "@server/languages/tact/psi/Node"

const REPLACEMENTS: Record<string, string> = {
    log: "log2",
    pow: "pow2",
}

export class OptimalMathFunctionsInspection implements Inspection {
    public readonly id: "optimal-math-functions" = InspectionIds.OPTIMAL_MATH_FUNCTIONS

    public inspect(file: File): lsp.Diagnostic[] {
        if (file.fromStdlib) return []
        const diagnostics: lsp.Diagnostic[] = []
        this.checkFile(file, diagnostics)
        return diagnostics
    }

    protected checkFile(file: File, diagnostics: lsp.Diagnostic[]): void {
        if (file.fromStdlib) return

        RecursiveVisitor.visit(file.rootNode, node => {
            if (node.type !== "static_call_expression") return

            const call = new CallLike(node, file)
            const name = call.name()
            const replacement = REPLACEMENTS[name] ?? undefined
            if (!replacement) return

            const args = call.arguments()
            if (args.length !== 2) return

            const secondArg = args[1]
            if (secondArg.text !== "2") return

            diagnostics.push({
                severity: lsp.DiagnosticSeverity.Information,
                range: asLspRange(node),
                message: `Function \`${name}\` can be rewritten as more efficient \`${replacement}\``,
                code: "performance",
                source: "tact",
                data: this.rewrite(call, replacement),
            })
        })
    }

    private rewrite(call: CallLike, newName: string): undefined | lsp.CodeAction {
        const nameNode = call.nameIdentifier()
        if (!nameNode) return undefined
        const diff = FileDiff.forFile(call.file.uri)

        const firstArgument = call.arguments()[0]
        diff.replace(asLspRange(call.node), `${newName}(${firstArgument.text})`)

        const edit = diff.toWorkspaceEdit()
        return {
            edit,
            title: `Replace with \`${newName}\``,
            isPreferred: true,
        }
    }
}
