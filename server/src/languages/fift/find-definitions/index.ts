import type {Node as SyntaxNode} from "web-tree-sitter"
import {File} from "@server/languages/tact/psi/File"
import * as lsp from "vscode-languageserver"
import {FiftReference} from "@server/languages/fift/psi/FiftReference"
import {asLspRange} from "@server/utils/position"

export function provideFiftDefinition(
    node: SyntaxNode,
    file: File,
): lsp.Location[] | lsp.LocationLink[] {
    const definition = FiftReference.resolve(node, file)
    if (!definition) return []

    return [
        {
            uri: file.uri,
            range: asLspRange(definition),
        },
    ]
}
