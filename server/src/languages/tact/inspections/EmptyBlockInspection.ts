//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import * as lsp from "vscode-languageserver"
import type {TactFile} from "@server/languages/tact/psi/TactFile"
import {asLspRange} from "@server/utils/position"
import {RecursiveVisitor} from "@server/languages/tact/psi/RecursiveVisitor"
import {Inspection, InspectionIds} from "./Inspection"

export class EmptyBlockInspection implements Inspection {
    public readonly id: "empty-block" = InspectionIds.EMPTY_BLOCK

    public inspect(file: TactFile): lsp.Diagnostic[] {
        if (file.fromStdlib) return []
        const diagnostics: lsp.Diagnostic[] = []

        const blockTypes = new Set([
            "function_body",
            "receive_body",
            "bounced_body",
            "external_body",
            "init_body",
            "block_statement",
            "if_statement",
            "else_clause",
            "while_statement",
            "repeat_statement",
            "try_statement",
            "catch_clause",
            "foreach_statement",
        ])

        RecursiveVisitor.visit(file.rootNode, node => {
            if (blockTypes.has(node.type)) {
                const body = node.children.find(child => child?.type === "block_statement")
                // only { and }
                if (body && body.children.length <= 2) {
                    const openBrace = body.firstChild
                    if (!openBrace) return

                    diagnostics.push({
                        severity: lsp.DiagnosticSeverity.Warning,
                        range: asLspRange(openBrace),
                        message: "Empty code block",
                        source: "tact",
                        code: "empty-block",
                    })
                }
            }
        })

        return diagnostics
    }
}
