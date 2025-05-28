import type {Node as SyntaxNode} from "web-tree-sitter"
import * as lsp from "vscode-languageserver"
import {TlbReference} from "@server/languages/tlb/psi/TlbReference"
import {asLspRange} from "@server/utils/position"
import {TlbFile} from "@server/languages/tlb/psi/TlbFile"
import {TlbNode} from "@server/languages/tlb/psi/TlbNode"

export function provideTlbDefinition(
    hoverNode: SyntaxNode,
    file: TlbFile,
): lsp.Location[] | lsp.LocationLink[] {
    if (hoverNode.type === "identifier" || hoverNode.type === "type_identifier") {
        const target = TlbReference.resolve(new TlbNode(hoverNode, file))
        if (target) {
            return [
                {
                    uri: file.uri,
                    range: asLspRange(target.node),
                },
            ]
        }
    }
    return []
}
