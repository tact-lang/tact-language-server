//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import {FoldingRange, FoldingRangeKind} from "vscode-languageserver-types"
import {RecursiveVisitor} from "@server/psi/visitor"
import type {File} from "@server/psi/File"
import type {Point} from "web-tree-sitter"
import type * as lsp from "vscode-languageserver"

export function collectFift(file: File): FoldingRange[] {
    const result: FoldingRange[] = []

    const genericFolding = (start: Point, end: Point): lsp.FoldingRange => {
        return {
            kind: FoldingRangeKind.Region,
            startLine: start.row,
            endLine: end.row - 1,
            startCharacter: end.column,
            endCharacter: end.column,
        }
    }

    RecursiveVisitor.visit(file.rootNode, (n): boolean => {
        if (
            n.type === "program" ||
            n.type === "proc_definition" ||
            n.type === "proc_inline_definition" ||
            n.type === "method_definition" ||
            n.type === "block_instruction" ||
            n.type === "instruction_block" ||
            n.type === "if_statement" ||
            n.type === "ifjmp_statement" ||
            n.type === "while_statement" ||
            n.type === "repeat_statement" ||
            n.type === "until_statement"
        ) {
            const openBrace = n.firstChild
            const closeBrace = n.lastChild
            if (!openBrace || !closeBrace) return true

            result.push(genericFolding(openBrace.endPosition, closeBrace.startPosition))
        }

        return true
    })

    return result
}
