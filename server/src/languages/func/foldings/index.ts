//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import {FoldingRange, FoldingRangeKind} from "vscode-languageserver-types"
import {RecursiveVisitor} from "@server/languages/tact/psi/visitor"
import type {Point} from "web-tree-sitter"
import type * as lsp from "vscode-languageserver"
import {FuncFile} from "@server/languages/func/psi/FuncFile"

export function provideFuncFoldingRanges(file: FuncFile): FoldingRange[] {
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
            n.type === "function_definition" ||
            n.type === "block_statement" ||
            n.type === "if_statement" ||
            n.type === "while_statement" ||
            n.type === "repeat_statement"
        ) {
            const openBrace = n.firstChild
            const closeBrace = n.lastChild
            if (!openBrace || !closeBrace) return true

            // Check if this is a block with braces
            if (openBrace.type === "{" && closeBrace.type === "}") {
                result.push(genericFolding(openBrace.endPosition, closeBrace.startPosition))
            }
        }

        // Fold comments
        if (n.type === "comment") {
            const lines = n.text.split("\n")
            if (lines.length > 1) {
                result.push({
                    kind: FoldingRangeKind.Comment,
                    startLine: n.startPosition.row,
                    endLine: n.endPosition.row,
                    startCharacter: n.startPosition.column,
                    endCharacter: n.endPosition.column,
                })
            }
        }

        return true
    })

    return result
}
