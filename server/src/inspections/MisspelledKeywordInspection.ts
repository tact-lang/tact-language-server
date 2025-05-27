//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import * as lsp from "vscode-languageserver"
import type {File} from "@server/psi/File"
import {Inspection, InspectionIds} from "./Inspection"
import {asLspRange} from "@server/utils/position"
import {RecursiveVisitor} from "@server/psi/RecursiveVisitor"

export class MisspelledKeywordInspection implements Inspection {
    public readonly id: "misspelled-keyword" = InspectionIds.MISSPELLED_KEYWORD

    public inspect(file: File): lsp.Diagnostic[] {
        if (file.fromStdlib) return []
        const diagnostics: lsp.Diagnostic[] = []
        this.checkFile(file, diagnostics)
        return diagnostics
    }

    protected checkFile(file: File, diagnostics: lsp.Diagnostic[]): void {
        if (file.fromStdlib) return

        RecursiveVisitor.visit(file.rootNode, node => {
            if (node.type === "identifier" && (node.text === "initof" || node.text === "codeof")) {
                // check case
                // initof Foo()
                //        ^^^ ERROR node
                const nextSibling = node.nextSibling ?? node.parent?.nextSibling
                if (nextSibling?.type === "ERROR" || nextSibling?.type === "expression_statement") {
                    if (nextSibling.startPosition.row !== node.endPosition.row) {
                        // different lines, most likely several statements
                        return
                    }

                    const expression = nextSibling.firstChild
                    if (!expression) return

                    const actualName = node.text === "initof" ? "initOf" : "codeOf"
                    diagnostics.push({
                        severity: lsp.DiagnosticSeverity.Warning,
                        range: asLspRange(node),
                        message: `Did you mean \`${actualName}\`?`,
                        source: "tact",
                        code: "misspelled-keyword",
                    })
                }
            }
        })
    }
}
