import {RecursiveVisitor} from "@server/psi/visitor"
import type {File} from "@server/psi/File"
import {Reference} from "@server/psi/Reference"
import type {Node as SyntaxNode} from "web-tree-sitter"
import {NamedNode} from "@server/psi/Node"
import * as lsp from "vscode-languageserver"
import type {SemanticTokens} from "vscode-languageserver"
import {isNamedFunNode} from "@server/psi/utils"

export function collect(file: File): SemanticTokens {
    const builder = new lsp.SemanticTokensBuilder()

    function pushToken(n: SyntaxNode, tokenType: lsp.SemanticTokenTypes): void {
        builder.push(
            n.startPosition.row,
            n.startPosition.column,
            n.endPosition.column - n.startPosition.column,
            Object.keys(lsp.SemanticTokenTypes).indexOf(tokenType),
            0,
        )
    }

    RecursiveVisitor.visit(file.rootNode, (n): boolean => {
        const type = n.type

        // asm fun foo() {}
        // ^^^ this
        if (type === "asm" && n.parent?.type === "asm_function") {
            pushToken(n, lsp.SemanticTokenTypes.keyword)
            return true
        }

        if (type === "global_constant") {
            const name = n.childForFieldName("name")
            if (!name) return true
            pushToken(name, lsp.SemanticTokenTypes.property)
            return true
        }

        if (type === "storage_function") {
            const name = n.childForFieldName("name")
            if (!name) return true
            pushToken(name, lsp.SemanticTokenTypes.function)
            return true
        }

        if (type === "parameter") {
            const name = n.childForFieldName("name")
            if (!name) return true
            pushToken(name, lsp.SemanticTokenTypes.parameter)
            return true
        }

        if (type === "let_statement") {
            const name = n.childForFieldName("name")
            if (!name) return true
            pushToken(name, lsp.SemanticTokenTypes.variable)
            return true
        }

        if (type === "field" || type === "storage_variable") {
            const name = n.childForFieldName("name")
            if (!name) return true
            pushToken(name, lsp.SemanticTokenTypes.property)
            return true
        }

        if (type === "constant" || type === "storage_constant") {
            const name = n.childForFieldName("name")
            if (!name) return true
            pushToken(name, lsp.SemanticTokenTypes.enumMember)
            return true
        }

        if (type === "identifier") {
            // asm fun foo() { ONE }
            //                 ^^^ this
            if (n.parent?.type === "tvm_ordinary_word") {
                pushToken(n, lsp.SemanticTokenTypes.macro)
                return true
            }

            const element = new NamedNode(n, file)
            const resolved = Reference.resolve(element)
            if (!resolved) return true
            const resolvedType = resolved.node.type

            switch (resolvedType) {
                case "parameter": {
                    pushToken(n, lsp.SemanticTokenTypes.parameter)
                    break
                }
                case "field":
                case "storage_variable": {
                    pushToken(n, lsp.SemanticTokenTypes.property)
                    break
                }
                case "constant":
                case "storage_constant": {
                    pushToken(n, lsp.SemanticTokenTypes.enumMember)
                    break
                }
                default: {
                    if (isNamedFunNode(resolved.node)) {
                        pushToken(n, lsp.SemanticTokenTypes.function)
                    } else if (resolved.node.parent?.type === "let_statement") {
                        pushToken(n, lsp.SemanticTokenTypes.variable)
                    }
                }
            }
        }

        return true
    })

    return builder.build()
}
