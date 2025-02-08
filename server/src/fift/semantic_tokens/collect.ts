import {SemanticTokens} from "vscode-languageserver"
import {File} from "@server/psi/File"
import {RecursiveVisitor} from "@server/psi/visitor"
import {SemanticTokensBuilder} from "vscode-languageserver/lib/common/semanticTokens"
import {SemanticTokenTypes} from "vscode-languageserver-protocol"
import {Node as SyntaxNode} from "web-tree-sitter"
import * as lsp from "vscode-languageserver"
import {FiftReference} from "@server/fift/psi/FiftReference"

export function collectFift(
    file: File,
    settings: {
        enabled: boolean
    },
): SemanticTokens | null {
    if (!settings.enabled) {
        return null
    }

    const builder = new SemanticTokensBuilder()

    function pushToken(n: SyntaxNode, tokenType: lsp.SemanticTokenTypes) {
        builder.push(
            n.startPosition.row,
            n.startPosition.column,
            n.endPosition.column - n.startPosition.column,
            Object.keys(lsp.SemanticTokenTypes).indexOf(tokenType.toString()),
            0,
        )
    }

    RecursiveVisitor.visit(file.rootNode, (node): boolean => {
        if (
            node.type === "proc_definition" ||
            node.type === "proc_inline_definition" ||
            node.type === "proc_ref_definition" ||
            node.type === "method_definition" ||
            node.type === "declaration"
        ) {
            const nameNode = node.childForFieldName("name")
            if (nameNode) {
                pushToken(nameNode, SemanticTokenTypes.function)
            }
        }

        if (
            node.type === "identifier" &&
            node.parent?.type === "proc_call" &&
            node.parent.firstChild?.equals(node)
        ) {
            const def = FiftReference.resolve(node, file)
            if (def) {
                pushToken(node, SemanticTokenTypes.function)
            }
        }

        return true
    })

    return builder.build()
}
