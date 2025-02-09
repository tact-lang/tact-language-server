import * as lsp from "vscode-languageserver/node"
import type * as Parser from "web-tree-sitter"

export function asNullableLspRange(node: Parser.Node | null | undefined): lsp.Range {
    if (!node) {
        return lsp.Range.create(0, 1, 0, 1)
    }

    return lsp.Range.create(
        node.startPosition.row,
        node.startPosition.column,
        node.endPosition.row,
        node.endPosition.column,
    )
}

export function asLspRange(node: Parser.Node): lsp.Range {
    return lsp.Range.create(
        node.startPosition.row,
        node.startPosition.column,
        node.endPosition.row,
        node.endPosition.column,
    )
}

export function asLspPosition(pos: Parser.Point): lsp.Position {
    return lsp.Position.create(pos.row, pos.column)
}

export function asParserPoint(position: lsp.Position): Parser.Point {
    return {
        column: position.character,
        row: position.line,
    }
}
