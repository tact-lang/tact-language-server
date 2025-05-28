//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import {SemanticTokens, SemanticTokensBuilder} from "vscode-languageserver"
import {SemanticTokenTypes} from "vscode-languageserver-protocol"
import {RecursiveVisitor} from "@server/languages/tact/psi/RecursiveVisitor"
import type {Node as SyntaxNode} from "web-tree-sitter"
import * as lsp from "vscode-languageserver"
import {TlbReference} from "@server/languages/tlb/psi/TlbReference"
import {TlbFile} from "@server/languages/tlb/psi/TlbFile"
import {TlbNode} from "@server/languages/tlb/psi/TlbNode"

export function collect(file: TlbFile): SemanticTokens {
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
                const resolved = TlbReference.resolve(new TlbNode(node, file))
                if (resolved) {
                    const insideTypeParameter =
                        resolved.parentOfType("type_parameter") !== undefined
                    if (insideTypeParameter) {
                        pushToken(node, SemanticTokenTypes.typeParameter)
                        break
                    }
                }
                break
            }
            case "type_identifier": {
                const parent = node.parent
                if (!parent) break

                if (parent.type === "combinator" || parent.type === "combinator_expr") {
                    pushToken(node, SemanticTokenTypes.class)
                    break
                }

                const resolved = TlbReference.resolve(new TlbNode(node, file))
                if (resolved) {
                    if (resolved.node.parent?.type === "field_named") {
                        pushToken(node, SemanticTokenTypes.variable)
                        break
                    }
                    const insideTypeParameter =
                        resolved.parentOfType("type_parameter") !== undefined
                    if (insideTypeParameter) {
                        pushToken(node, SemanticTokenTypes.typeParameter)
                        break
                    }
                }

                pushToken(node, SemanticTokenTypes.type)
                break
            }
            case "type_parameter": {
                const name = TlbReference.findTypeParameterNode(node)
                if (!name) break
                pushToken(name, SemanticTokenTypes.typeParameter)
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
                break
            }
            case "combinator": {
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
