import type {Node as SyntaxNode} from "web-tree-sitter"
import * as lsp from "vscode-languageserver"
import {TlbReference} from "@server/languages/tlb/psi/TlbReference"
import {asLspRange} from "@server/utils/position"
import {TlbFile} from "@server/languages/tlb/psi/TlbFile"
import {NamedNode} from "@server/languages/tlb/psi/TlbNode"

export function provideTlbDefinition(
    node: SyntaxNode,
    file: TlbFile,
): lsp.Location[] | lsp.LocationLink[] {
    if (node.type !== "identifier" && node.type !== "type_identifier") return []

    const target = TlbReference.resolve(new NamedNode(node, file))
    if (!target) return []

    if (target instanceof NamedNode) {
        const nameNode = target.nameNode()
        if (nameNode) {
            return [
                {
                    uri: file.uri,
                    range: asLspRange(nameNode.node),
                },
            ]
        }
    }

    return [
        {
            uri: file.uri,
            range: asLspRange(target.node),
        },
    ]
}
