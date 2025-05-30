//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio

import type {Node as SyntaxNode} from "web-tree-sitter"
import {FuncFile} from "./psi/FuncFile"
import {FuncNamedNode, FuncNode} from "./psi/FuncNode"
import {FuncReference} from "./psi/FuncReference"
import {
    FuncFunction,
    FuncGlobalVariable,
    FuncConstant,
    FuncParameter,
    FuncVariable,
} from "./psi/FuncDecls"
import {
    FuncTy,
    FuncPrimitiveTy,
    FuncTupleTy,
    FuncFunctionTy,
    FuncUnknownTy,
    FUNC_BUILTIN_TYPES,
    FUNC_METHOD_RETURN_TYPES,
} from "./types/BaseTy"

export class FuncExpression extends FuncNode {
    public override type(): FuncTy | null {
        return FuncTypeInferer.inferType(this)
    }
}

export class FuncTypeInferer {
    private static readonly cache: Map<number, FuncTy | null> = new Map()

    public static inferType(node: FuncNode): FuncTy | null {
        const cached = this.cache.get(node.node.id)
        if (cached !== undefined) {
            return cached
        }

        const result = new FuncTypeInferer().inferTypeImpl(node)
        this.cache.set(node.node.id, result)
        return result
    }

    public static clearCache(): void {
        this.cache.clear()
    }

    private inferTypeImpl(node: FuncNode): FuncTy | null {
        const nodeType = node.node.type

        // Literals
        if (nodeType === "number_literal") {
            return FUNC_BUILTIN_TYPES["int"]
        }

        if (nodeType === "string_literal" || nodeType === "slice_string_literal") {
            return FUNC_BUILTIN_TYPES["slice"]
        }

        if (nodeType === "number_string_literal") {
            return FUNC_BUILTIN_TYPES["int"]
        }

        // Type identifiers
        if (nodeType === "primitive_type") {
            const typeName = node.node.text
            return FUNC_BUILTIN_TYPES[typeName] || new FuncPrimitiveTy(typeName)
        }

        if (nodeType === "var_type") {
            return FUNC_BUILTIN_TYPES["var"]
        }

        // Identifiers
        if (nodeType === "identifier" || nodeType === "function_name") {
            const namedNode = new FuncNamedNode(node.node, node.file)
            const resolved = FuncReference.resolve(namedNode)

            if (!resolved) {
                // Check if it's a built-in type
                const builtinType = FUNC_BUILTIN_TYPES[node.node.text]
                if (builtinType) {
                    return builtinType
                }
                return new FuncUnknownTy()
            }

            return this.inferTypeFromResolved(resolved)
        }

        // Variable declaration - infer type from type annotation or initializer
        if (nodeType === "variable_declaration") {
            const typeNode = node.node.childForFieldName("type")
            if (typeNode) {
                return this.inferTypeImpl(new FuncNode(typeNode, node.file))
            }

            // No explicit type, try to infer from assignment context
            const parent = node.node.parent
            if (parent && parent.type === "expression_statement") {
                // Look for assignment pattern: var_decl = expression
                const assignment = parent.parent
                if (assignment && assignment.type === "assignment_expression") {
                    const rightSide = assignment.childForFieldName("right")
                    if (rightSide) {
                        return this.inferTypeImpl(new FuncNode(rightSide, node.file))
                    }
                }
            }

            return FUNC_BUILTIN_TYPES["var"]
        }

        // Function application
        if (nodeType === "function_application") {
            const functionNode = node.node.childForFieldName("function")
            if (!functionNode) return null

            const functionType = this.inferTypeImpl(new FuncNode(functionNode, node.file))
            if (functionType instanceof FuncFunctionTy) {
                return functionType.returnType
            }

            // Check for built-in functions
            if (functionNode.type === "identifier") {
                const funcName = functionNode.text
                return this.inferBuiltinFunctionReturnType(funcName, node)
            }

            return new FuncUnknownTy()
        }

        // Method call
        if (nodeType === "method_call") {
            const objectNode = node.node.parent
            const methodName = node.node.childForFieldName("method_name")

            if (!objectNode || !methodName) return null

            const objectType = this.inferTypeImpl(new FuncNode(objectNode, node.file))
            if (!objectType) return null

            const methodReturnType = this.inferMethodReturnType(objectType, methodName.text)
            return methodReturnType || new FuncUnknownTy()
        }

        // Tuple expressions
        if (nodeType === "tuple_expression" || nodeType === "tensor_expression") {
            const elementTypes: FuncTy[] = []

            for (const child of node.node.children) {
                if (child && child.type === "expression") {
                    const elementType = this.inferTypeImpl(new FuncNode(child, node.file))
                    if (elementType) {
                        elementTypes.push(elementType)
                    }
                }
            }

            return new FuncTupleTy(elementTypes)
        }

        // Parenthesized expression
        if (nodeType === "parenthesized_expression") {
            const innerNode = node.node.children[1] // Skip opening paren
            if (innerNode) {
                return this.inferTypeImpl(new FuncNode(innerNode, node.file))
            }
        }

        // Binary expressions
        if (nodeType === "binary_expression") {
            return this.inferBinaryExpressionType(node)
        }

        // Unary expressions
        if (nodeType === "unary_expression") {
            const operator = node.node.childForFieldName("operator")?.text
            const operand = node.node.childForFieldName("operand")

            if (!operand) return null

            const operandType = this.inferTypeImpl(new FuncNode(operand, node.file))
            if (!operandType) return null

            if (operator === "~" || operator === "-") {
                return operandType
            }

            return new FuncUnknownTy()
        }

        // Assignment expressions
        if (nodeType === "assignment_expression") {
            const rightSide = node.node.childForFieldName("right")
            if (rightSide) {
                return this.inferTypeImpl(new FuncNode(rightSide, node.file))
            }
        }

        return null
    }

    private inferTypeFromResolved(resolved: FuncNamedNode): FuncTy | null {
        if (resolved instanceof FuncFunction) {
            // Infer parameter types
            const paramTypes: FuncTy[] = []
            const argsNode = resolved.argumentsNode()
            if (argsNode) {
                for (const child of argsNode.children) {
                    if (child && child.type === "parameter_declaration") {
                        const paramType = this.inferParameterType(child, resolved.file)
                        if (paramType) {
                            paramTypes.push(paramType)
                        }
                    }
                }
            }

            // Infer return type
            const returnTypeNode = resolved.returnType()
            const returnType = returnTypeNode
                ? this.inferTypeImpl(new FuncNode(returnTypeNode, resolved.file))
                : FUNC_BUILTIN_TYPES["var"]

            return new FuncFunctionTy(paramTypes, returnType || FUNC_BUILTIN_TYPES["var"], resolved)
        }

        if (resolved instanceof FuncParameter) {
            const typeNode = resolved.typeNode()
            if (typeNode) {
                return this.inferTypeImpl(new FuncNode(typeNode, resolved.file))
            }
            return FUNC_BUILTIN_TYPES["var"]
        }

        if (resolved instanceof FuncVariable) {
            // Try to infer from declaration context
            const parent = resolved.node.parent
            if (parent && parent.type === "variable_declaration") {
                const typeNode = parent.childForFieldName("type")
                if (typeNode) {
                    return this.inferTypeImpl(new FuncNode(typeNode, resolved.file))
                }
            }
            return FUNC_BUILTIN_TYPES["var"]
        }

        if (resolved instanceof FuncGlobalVariable) {
            const typeNode = resolved.typeNode()
            if (typeNode) {
                return this.inferTypeImpl(new FuncNode(typeNode, resolved.file))
            }
            return FUNC_BUILTIN_TYPES["var"]
        }

        if (resolved instanceof FuncConstant) {
            const typeNode = resolved.typeNode()
            if (typeNode) {
                return this.inferTypeImpl(new FuncNode(typeNode, resolved.file))
            }

            // Try to infer from value
            const valueNode = resolved.valueNode()
            if (valueNode) {
                return this.inferTypeImpl(new FuncNode(valueNode, resolved.file))
            }

            return FUNC_BUILTIN_TYPES["var"]
        }

        return new FuncUnknownTy()
    }

    private inferParameterType(paramNode: SyntaxNode, file: FuncFile): FuncTy | null {
        const typeNode = paramNode.childForFieldName("type")
        if (typeNode) {
            return this.inferTypeImpl(new FuncNode(typeNode, file))
        }
        return FUNC_BUILTIN_TYPES["var"]
    }

    private inferBuiltinFunctionReturnType(funcName: string, node: FuncNode): FuncTy | null {
        // Common built-in functions
        const builtinReturnTypes: Record<string, string> = {
            begin_cell: "builder",
            end_parse: "var",
            null: "var",
            now: "int",
            my_address: "slice",
            get_balance: "tuple",
            cur_lt: "int",
            block_lt: "int",
            cell_hash: "int",
            slice_hash: "int",
            random: "int",
            get_seed: "int",
            min: "int",
            max: "int",
            abs: "int",
        }

        const returnTypeName = builtinReturnTypes[funcName]
        if (returnTypeName) {
            return FUNC_BUILTIN_TYPES[returnTypeName] || new FuncPrimitiveTy(returnTypeName)
        }

        return new FuncUnknownTy()
    }

    private inferMethodReturnType(objectType: FuncTy, methodName: string): FuncTy | null {
        const objectTypeName = objectType.name()
        const methodReturnTypes = FUNC_METHOD_RETURN_TYPES[objectTypeName]

        if (methodReturnTypes) {
            const returnTypeName = methodReturnTypes[methodName]
            if (returnTypeName) {
                return FUNC_BUILTIN_TYPES[returnTypeName] || new FuncPrimitiveTy(returnTypeName)
            }
        }

        // For modifying methods (those ending with ~), return the object type
        if (methodName.startsWith("~")) {
            return objectType
        }

        return new FuncUnknownTy()
    }

    private inferBinaryExpressionType(node: FuncNode): FuncTy | null {
        const children = node.node.children
        if (children.length < 3) return null

        const operator = children[1]?.text
        if (!operator || !children[0] || !children[2]) return null

        const leftType = this.inferTypeImpl(new FuncNode(children[0], node.file))
        const rightType = this.inferTypeImpl(new FuncNode(children[2], node.file))

        if (!leftType || !rightType) return null

        // Comparison operators return int (boolean-like)
        if (["==", "!=", "<", ">", "<=", ">=", "<=>"].includes(operator)) {
            return FUNC_BUILTIN_TYPES["int"]
        }

        // Arithmetic operators
        if (["+", "-", "*", "/", "%", "~/", "^/", "~%", "^%", "/%"].includes(operator)) {
            return FUNC_BUILTIN_TYPES["int"]
        }

        // Bitwise operators
        if (["&", "|", "^", "<<", ">>", "~>>", "^>>"].includes(operator)) {
            return FUNC_BUILTIN_TYPES["int"]
        }

        // Assignment operators return the left type
        if (["=", "+=", "-=", "*=", "/=", "&=", "|=", "^="].includes(operator)) {
            return leftType
        }

        return leftType
    }
}
