import type {Node as SyntaxNode} from "web-tree-sitter"
import {File} from "@server/languages/tact/psi/File"
import * as lsp from "vscode-languageserver"
import {TlbReference} from "@server/languages/tlb/psi/TlbReference"
import {asLspRange} from "@server/utils/position"

export function provideTlbDefinition(
    hoverNode: SyntaxNode,
    file: File,
): lsp.Location[] | lsp.LocationLink[] {
    if (hoverNode.type === "identifier" || hoverNode.type === "type_identifier") {
        const ref = new TlbReference(hoverNode, file)
        const target = ref.resolve()
        if (target) {
            return [
                {
                    uri: file.uri,
                    range: asLspRange(target),
                },
            ]
        }
    }
    return []
}
