import type {Node as SyntaxNode} from "web-tree-sitter"
import {TactFile} from "@server/languages/tact/psi/TactFile"
import * as lsp from "vscode-languageserver"
import {Referent} from "@server/languages/tact/psi/Referent"
import {TactNode} from "@server/languages/tact/psi/TactNode"
import {asLspRange} from "@server/utils/position"

export function provideTactDocumentHighlight(
    highlightNode: SyntaxNode,
    file: TactFile,
): lsp.DocumentHighlight[] | null {
    if (
        highlightNode.type !== "identifier" &&
        highlightNode.type !== "self" &&
        highlightNode.type !== "type_identifier"
    ) {
        return []
    }

    const result = new Referent(highlightNode, file).findReferences({
        includeDefinition: true,
        sameFileOnly: true,
        includeSelf: true,
    })
    if (result.length === 0) return null

    const usageKind = (value: TactNode): lsp.DocumentHighlightKind => {
        const parent = value.node.parent
        if (
            parent?.type === "assignment_statement" ||
            parent?.type === "augmented_assignment_statement"
        ) {
            if (parent.childForFieldName("left")?.equals(value.node)) {
                // left = 10
                // ^^^^
                return lsp.DocumentHighlightKind.Write
            }
        }

        return lsp.DocumentHighlightKind.Read
    }

    return result.map(value => ({
        range: asLspRange(value.node),
        kind: usageKind(value),
    }))
}
