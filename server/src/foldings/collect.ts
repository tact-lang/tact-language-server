import {FoldingRange, FoldingRangeKind} from "vscode-languageserver-types"
import {RecursiveVisitor} from "@server/psi/visitor"
import type {File} from "@server/psi/File"
import type {Point} from "web-tree-sitter"
import type * as lsp from "vscode-languageserver"

export function collect(file: File): FoldingRange[] {
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
            n.type === "contract_body" ||
            n.type === "asm_sequence" ||
            n.type === "trait_body"
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
