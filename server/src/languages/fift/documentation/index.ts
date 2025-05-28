import type {Node as SyntaxNode} from "web-tree-sitter"
import {File} from "@server/languages/tact/psi/File"
import * as lsp from "vscode-languageserver"
import {generateFiftDocFor} from "@server/languages/fift/documentation/documentation"
import {asLspRange} from "@server/utils/position"

export function provideFiftDocumentation(hoverNode: SyntaxNode, file: File): lsp.Hover | null {
    const doc = generateFiftDocFor(hoverNode, file)
    if (doc === null) return null

    return {
        range: asLspRange(hoverNode),
        contents: {
            kind: "markdown",
            value: doc,
        },
    }
}
