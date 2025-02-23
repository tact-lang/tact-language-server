import {SemanticTokens, SemanticTokensBuilder} from "vscode-languageserver"
import {File} from "@server/psi/File"
import {SemanticTokenTypes} from "vscode-languageserver-protocol"
import {RecursiveVisitor} from "@server/psi/RecursiveVisitor"
import type {Node as SyntaxNode} from "web-tree-sitter"
import * as lsp from "vscode-languageserver"

export function collect(file: File): SemanticTokens {
    const builder = new SemanticTokensBuilder()

    function pushToken(n: SyntaxNode, tokenType: lsp.SemanticTokenTypes): void {
        builder.push(
            n.startPosition.row,
            n.startPosition.column,
            n.endPosition.column - n.startPosition.column,
            Object.keys(lsp.SemanticTokenTypes).indexOf(tokenType),
            0,
        )
    }

    RecursiveVisitor.visit(file.rootNode, (node): boolean => {
        switch (node.type) {
            case "##": {
                pushToken(node, SemanticTokenTypes.macro)
                break
            }
            case "identifier": {
                // pushToken(node, SemanticTokenTypes.variable)
                break
            }
            case "type_identifier": {
                const parent = node.parent
                if (!parent) break

                if (parent.type === "combinator") {
                    pushToken(node, SemanticTokenTypes.class)
                    break
                }

                pushToken(node, SemanticTokenTypes.type)
                break
            }
            case "field_named": {
                const identifier = node.firstNamedChild
                if (!identifier) break
                pushToken(identifier, SemanticTokenTypes.property)
                break
            }
            case "constructor_": {
                const identifier = node.firstNamedChild
                if (identifier && identifier.type === "identifier") {
                    pushToken(identifier, SemanticTokenTypes.type)
                }
                break
            }
            case "constructor_tag": {
                pushToken(node, SemanticTokenTypes.typeParameter)
                break
            }
            case "combinator": {
                // pushToken(node, SemanticTokenTypes.typeParameter)
                break
            }
            case "hex": {
                pushToken(node, SemanticTokenTypes.number)
                break
            }
            case "number": {
                pushToken(node, SemanticTokenTypes.number)
                break
            }
            case "builtin_field": {
                pushToken(node, SemanticTokenTypes.property)
                break
            }
        }
        return true
    })

    return builder.build()
}
