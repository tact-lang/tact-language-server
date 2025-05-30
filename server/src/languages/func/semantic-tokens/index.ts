//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type {Node as SyntaxNode} from "web-tree-sitter"
import * as lsp from "vscode-languageserver"
import type {SemanticTokens} from "vscode-languageserver"
import {Tokens} from "@server/languages/tact/semantic-tokens/tokens"
import {FuncFile} from "@server/languages/func/psi/FuncFile"
import {FuncNamedNode} from "@server/languages/func/psi/FuncNode"
import {FuncReference} from "@server/languages/func/psi/FuncReference"
import {
    FuncFunction,
    FuncGlobalVariable,
    FuncConstant,
    FuncParameter,
    FuncVariable,
} from "@server/languages/func/psi/FuncDecls"

export function provideFuncSemanticTokens(file: FuncFile): SemanticTokens {
    const tokens = new Tokens()

    const processNode = (node: SyntaxNode) => {
        switch (node.type) {
            case "comment": {
                tokens.node(node, lsp.SemanticTokenTypes.comment)
                break
            }

            case "string_literal":
            case "number_string_literal":
            case "slice_string_literal": {
                tokens.node(node, lsp.SemanticTokenTypes.string)
                break
            }

            case "number_literal": {
                tokens.node(node, lsp.SemanticTokenTypes.number)
                break
            }

            case "function_definition": {
                const nameNode = node.childForFieldName("name")
                if (nameNode) {
                    tokens.node(nameNode, lsp.SemanticTokenTypes.function)
                }
                break
            }

            case "function_application": {
                const functionNode = node.childForFieldName("function")
                if (functionNode && functionNode.type === "identifier") {
                    tokens.node(functionNode, lsp.SemanticTokenTypes.function)
                }
                break
            }

            case "method_call": {
                const methodNameNode = node.childForFieldName("method_name")
                if (methodNameNode) {
                    tokens.node(methodNameNode, lsp.SemanticTokenTypes.method)
                }
                break
            }

            case "parameter_declaration": {
                const paramNameNode = node.childForFieldName("name")
                if (paramNameNode) {
                    tokens.node(paramNameNode, lsp.SemanticTokenTypes.parameter)
                }
                break
            }

            case "global_var_declaration": {
                const globalNameNode = node.childForFieldName("name")
                if (globalNameNode) {
                    tokens.node(globalNameNode, lsp.SemanticTokenTypes.variable)
                }
                break
            }

            case "constant_declaration": {
                const constNameNode = node.childForFieldName("name")
                if (constNameNode) {
                    tokens.node(constNameNode, lsp.SemanticTokenTypes.variable)
                }
                break
            }

            case "variable_declaration": {
                const variableNode = node.childForFieldName("variable")
                if (variableNode) {
                    if (variableNode.type === "identifier") {
                        tokens.node(variableNode, lsp.SemanticTokenTypes.variable)
                    } else if (
                        variableNode.type === "tensor_expression" ||
                        variableNode.type === "tuple_expression"
                    ) {
                        // Handle tuple destructuring
                        const extractAndMarkIdentifiers = (n: SyntaxNode) => {
                            if (n.type === "identifier") {
                                tokens.node(n, lsp.SemanticTokenTypes.variable)
                            }
                            for (const child of n.children) {
                                if (child) {
                                    extractAndMarkIdentifiers(child)
                                }
                            }
                        }
                        extractAndMarkIdentifiers(variableNode)
                    }
                }
                break
            }

            case "identifier":
            case "function_name": {
                // Resolve the identifier to determine its type
                const namedNode = new FuncNamedNode(node, file)
                const definition = FuncReference.resolve(namedNode)

                if (definition) {
                    if (definition instanceof FuncFunction) {
                        tokens.node(node, lsp.SemanticTokenTypes.function)
                    } else if (definition instanceof FuncParameter) {
                        tokens.node(node, lsp.SemanticTokenTypes.parameter)
                    } else if (definition instanceof FuncVariable) {
                        tokens.node(node, lsp.SemanticTokenTypes.variable)
                    } else if (definition instanceof FuncGlobalVariable) {
                        tokens.node(node, lsp.SemanticTokenTypes.variable)
                    } else if (definition instanceof FuncConstant) {
                        tokens.node(node, lsp.SemanticTokenTypes.variable)
                    }
                } else {
                    // Check if it's a built-in type
                    const builtinTypes = ["int", "cell", "slice", "builder", "cont", "tuple", "var"]
                    if (builtinTypes.includes(node.text)) {
                        tokens.node(node, lsp.SemanticTokenTypes.type)
                    }
                    // Check if it's a keyword
                    else {
                        const keywords = [
                            "if",
                            "ifnot",
                            "else",
                            "elseif",
                            "elseifnot",
                            "while",
                            "until",
                            "do",
                            "repeat",
                            "return",
                            "try",
                            "catch",
                            "global",
                            "const",
                            "forall",
                            "impure",
                            "inline",
                            "inline_ref",
                            "method_id",
                            "asm",
                        ]
                        if (keywords.includes(node.text)) {
                            tokens.node(node, lsp.SemanticTokenTypes.keyword)
                        }
                    }
                }
                break
            }
        }

        // Recursively process children
        for (const child of node.children) {
            if (child) {
                processNode(child)
            }
        }
    }

    processNode(file.rootNode)

    return {
        resultId: Date.now().toString(),
        data: tokens.result(),
    }
}
