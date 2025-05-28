//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import * as lsp from "vscode-languageserver"
import type {File} from "@server/languages/tact/psi/File"
import {Inspection, InspectionIds} from "./Inspection"
import {RecursiveVisitor} from "@server/languages/tact/psi/RecursiveVisitor"
import {Reference} from "@server/languages/tact/psi/Reference"
import {NamedNode} from "@server/languages/tact/psi/Node"
import {asLspRange} from "@server/utils/position"
import {isDeprecated} from "@server/languages/tact/psi/utils"

export class DeprecatedSymbolUsageInspection implements Inspection {
    public readonly id: "deprecated-symbol-usage" = InspectionIds.DEPRECATED_SYMBOL_USAGE

    public inspect(file: File): lsp.Diagnostic[] {
        if (file.fromStdlib) return []
        const diagnostics: lsp.Diagnostic[] = []
        this.checkFile(file, diagnostics)
        return diagnostics
    }

    protected checkFile(file: File, diagnostics: lsp.Diagnostic[]): void {
        RecursiveVisitor.visit(file.rootNode, node => {
            if (node.type !== "identifier" && node.type !== "type_identifier") return

            const resolved = Reference.resolve(new NamedNode(node, file))
            if (!resolved) return

            if (isDeprecated(resolved)) {
                diagnostics.push({
                    severity: lsp.DiagnosticSeverity.Hint,
                    tags: [lsp.DiagnosticTag.Deprecated],
                    range: asLspRange(node),
                    message: `Symbol \`${resolved.name()}\` is deprecated`,
                    source: "tact",
                })
            }
        })
    }
}
