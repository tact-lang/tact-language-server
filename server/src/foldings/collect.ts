import {FoldingRange, FoldingRangeKind} from "vscode-languageserver-types"
import {RecursiveVisitor} from "../visitor"
import {File} from "../psi/File"
import {Point} from "web-tree-sitter"
import * as lsp from "vscode-languageserver"

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
            n.type === "trait_body"
        ) {
            const openBrace = n.firstChild!
            const closeBrace = n.lastChild!
            result.push(genericFolding(openBrace.endPosition, closeBrace.startPosition))
        }

        return true
    })

    return result
}
