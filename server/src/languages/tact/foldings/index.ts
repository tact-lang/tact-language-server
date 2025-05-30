//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import {FoldingRange, FoldingRangeKind} from "vscode-languageserver-types"
import {RecursiveVisitor} from "@server/languages/tact/psi/visitor"
import type {TactFile} from "@server/languages/tact/psi/TactFile"
import type {Point} from "web-tree-sitter"
import type * as lsp from "vscode-languageserver"
import {isDocCommentOwner} from "@server/languages/tact/psi/utils"
import {extractCommentsDocContent, TactNode} from "@server/languages/tact/psi/TactNode"

export function provideTactFoldingRanges(file: TactFile): FoldingRange[] {
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
            n.type === "block_statement" ||
            n.type === "instance_argument_list" ||
            n.type === "function_body" ||
            n.type === "asm_function_body" ||
            n.type === "struct_body" ||
            n.type === "message_body" ||
            n.type === "contract_body" ||
            n.type === "asm_sequence" ||
            n.type === "trait_body"
        ) {
            const openBrace = n.firstChild
            const closeBrace = n.lastChild
            if (!openBrace || !closeBrace) return true

            result.push(genericFolding(openBrace.endPosition, closeBrace.startPosition))
        }

        if (isDocCommentOwner(n)) {
            const node = new TactNode(n, file)
            const comment = extractCommentsDocContent(node.node)
            if (!comment) return true

            result.push({
                kind: FoldingRangeKind.Comment,
                startLine: comment.startPosition.line,
                endLine: comment.startPosition.line + comment.lines.length - 1,
            })
        }

        return true
    })

    return result
}
