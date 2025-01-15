import {RecursiveVisitor} from "../visitor";
import {File} from "../psi/File";
import {Reference} from "../psi/Reference";
import {SyntaxNode} from "web-tree-sitter";
import {NamedNode} from "../psi/Node";
import * as lsp from "vscode-languageserver";
import {SemanticTokens} from "vscode-languageserver";
import {isNamedFunctionNode} from "../psi/utils";

export function collect(file: File): SemanticTokens {
    const builder = new lsp.SemanticTokensBuilder();

    function pushToken(n: SyntaxNode, tokenType: lsp.SemanticTokenTypes) {
        builder.push(
            n.startPosition.row,
            n.startPosition.column,
            n.endPosition.column - n.startPosition.column,
            Object.keys(lsp.SemanticTokenTypes).indexOf(tokenType.toString()),
            0,
        )
    }

    RecursiveVisitor.visit(file.rootNode, (n): boolean => {
        if (n.type === 'asm' && n.parent!.type === 'asm_function') {
            pushToken(n, lsp.SemanticTokenTypes.keyword);
        }

        if (n.type === 'global_constant') {
            const name = n.childForFieldName('name')!
            pushToken(name, lsp.SemanticTokenTypes.property);
        }

        if (n.type === 'storage_function') {
            const name = n.childForFieldName('name')!
            pushToken(name, lsp.SemanticTokenTypes.function);
        }

        if (n.type === 'parameter') {
            const name = n.childForFieldName('name')!
            pushToken(name, lsp.SemanticTokenTypes.parameter);
        }

        if (n.type === 'let_statement') {
            const name = n.childForFieldName('name')!
            pushToken(name, lsp.SemanticTokenTypes.variable);
        }

        if (n.type === 'field' || n.type === 'storage_variable') {
            const name = n.childForFieldName('name')!
            pushToken(name, lsp.SemanticTokenTypes.property);
        }

        if (n.type === 'constant' || n.type === 'storage_constant') {
            const name = n.childForFieldName('name')!
            pushToken(name, lsp.SemanticTokenTypes.enumMember);
        }

        if (n.type === 'identifier') {
            const element = new NamedNode(n, file)
            const resolved = Reference.resolve(element)
            if (!resolved) return true

            if (resolved.node.parent!.type === 'let_statement') {
                pushToken(n, lsp.SemanticTokenTypes.variable)
            }
            if (resolved.node.type === 'parameter') {
                pushToken(n, lsp.SemanticTokenTypes.parameter)
            }
            if (resolved.node.type === 'field' || resolved.node.type === 'storage_variable') {
                pushToken(n, lsp.SemanticTokenTypes.property)
            }
            if (resolved.node.type === 'constant' || resolved.node.type === 'storage_constant') {
                pushToken(n, lsp.SemanticTokenTypes.enumMember)
            }
            if (isNamedFunctionNode(resolved.node)) {
                pushToken(n, lsp.SemanticTokenTypes.function)
            }
        }

        return true
    })

    return builder.build()
}
