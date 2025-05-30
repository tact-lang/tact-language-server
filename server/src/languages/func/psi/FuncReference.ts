import type {Node as SyntaxNode} from "web-tree-sitter"
import {FuncFile} from "./FuncFile"
import {FuncNamedNode} from "./FuncNode"
import {
    FuncFunction,
    FuncParameter,
    FuncVariable,
    FuncGlobalVariable,
    FuncConstant,
} from "./FuncDecls"
import {RecursiveVisitor} from "@server/languages/tact/psi/visitor"

export interface FuncScopeProcessor {
    execute(node: FuncNamedNode): boolean
}

export class FuncReference {
    private readonly element: FuncNamedNode

    public static resolve(node: FuncNamedNode | null): FuncNamedNode | null {
        if (node === null) return null
        return new FuncReference(node).resolve()
    }

    public constructor(element: FuncNamedNode) {
        this.element = element
    }

    public resolve(): FuncNamedNode | null {
        if (this.element.node.startIndex === this.element.node.endIndex) return null

        const result: FuncNamedNode[] = []
        this.processResolveVariants(FuncReference.createResolveProcessor(result, this.element))
        if (result.length === 0) return null
        return result[0]
    }

    private static createResolveProcessor(
        result: FuncNamedNode[],
        element: FuncNamedNode,
    ): FuncScopeProcessor {
        return new (class implements FuncScopeProcessor {
            public execute(node: FuncNamedNode): boolean {
                if (node.node.equals(element.node)) {
                    result.push(node)
                    return false
                }

                const searchName = element.name()
                if (node.name() === searchName) {
                    result.push(node)
                    return false
                }

                return true
            }
        })()
    }

    public processResolveVariants(proc: FuncScopeProcessor): boolean {
        if (this.elementIsDeclarationName()) {
            // Function parameter, variable declaration, etc.
            const parent = this.element.node.parent
            if (!parent) return true
            return proc.execute(FuncReference.declarationAstToNode(parent, this.element.file))
        }

        const name = this.element.node.text
        if (!name || name === "" || name === "_") return true

        // Process block scope (local variables, parameters)
        if (!this.processBlock(proc)) return false

        // Process file scope (global functions, variables, constants)
        return this.processFileScope(proc)
    }

    private elementIsDeclarationName(): boolean {
        const identifier = this.element.node
        const parent = identifier.parent

        if (!parent) return false

        const name = parent.childForFieldName("name")
        if (!name) return false

        return (
            (parent.type === "function_definition" ||
                parent.type === "parameter_declaration" ||
                parent.type === "global_var_declaration" ||
                parent.type === "constant_declaration" ||
                (parent.type === "variable_declaration" && name.equals(identifier))) &&
            name.equals(identifier)
        )
    }

    private processBlock(proc: FuncScopeProcessor): boolean {
        const file = this.element.file
        let descendant: SyntaxNode | null = this.element.node
        let startStatement: SyntaxNode | null = null

        while (descendant) {
            // Process function parameters
            if (descendant.type === "function_definition") {
                const argsNode = descendant.childForFieldName("arguments")
                if (argsNode) {
                    const children = argsNode.children
                    for (const child of children) {
                        if (child && child.type === "parameter_declaration") {
                            const param = new FuncParameter(child, file)
                            if (!proc.execute(param)) return false
                        }
                    }
                }
            }

            // Process block statements for local variables
            if (descendant.type === "block_statement") {
                if (!this.processBlockStatements(descendant, proc, file, startStatement)) {
                    return false
                }
            }

            // Handle specific statement types that can contain variables
            if (descendant.type === "repeat_statement") {
                // Handle variables in repeat body
                const body = descendant.childForFieldName("body")
                if (body && body.type === "block_statement") {
                    if (!this.processBlockStatements(body, proc, file, null)) {
                        return false
                    }
                }
            }

            if (descendant.type === "if_statement") {
                // Handle variables in if body
                const body = descendant.childForFieldName("body")
                if (body && body.type === "block_statement") {
                    if (!this.processBlockStatements(body, proc, file, null)) {
                        return false
                    }
                }

                // Handle variables in else body
                const elseBody = descendant.childForFieldName("else")
                if (elseBody && elseBody.type === "block_statement") {
                    if (!this.processBlockStatements(elseBody, proc, file, null)) {
                        return false
                    }
                }
            }

            if (
                descendant.type === "variable_declaration" ||
                descendant.type === "expression_statement"
            ) {
                startStatement = descendant
            }

            descendant = descendant.parent
        }

        return true
    }

    private processBlockStatements(
        block: SyntaxNode,
        proc: FuncScopeProcessor,
        file: FuncFile,
        startStatement: SyntaxNode | null,
    ): boolean {
        const statements = block.children
        for (const stmt of statements) {
            if (!stmt) break

            // reached the starting statement, look no further
            if (startStatement && stmt.equals(startStatement)) break

            // Skip braces
            if (stmt.type === "{" || stmt.type === "}") continue

            // Process different statement types that can contain variable declarations
            if (!this.processStatementForVariables(stmt, proc, file)) {
                return false
            }
        }
        return true
    }

    private processStatementForVariables(
        stmt: SyntaxNode,
        proc: FuncScopeProcessor,
        file: FuncFile,
    ): boolean {
        // Handle expression statements (most common case)
        if (stmt.type === "expression_statement") {
            return this.processExpressionStatement(stmt, proc, file)
        }

        // Handle direct variable declarations
        if (stmt.type === "variable_declaration") {
            return this.processVariableDeclaration(stmt, proc, file)
        }

        // Handle repeat statements (they can have variable declarations)
        if (stmt.type === "repeat_statement") {
            const body = stmt.childForFieldName("body")
            if (body && body.type === "block_statement") {
                return this.processBlockStatements(body, proc, file, null)
            }
        }

        // Handle if/else statements
        if (stmt.type === "if_statement") {
            const ifBody = stmt.childForFieldName("body")
            if (ifBody && ifBody.type === "block_statement") {
                if (!this.processBlockStatements(ifBody, proc, file, null)) {
                    return false
                }
            }

            const elseBody = stmt.childForFieldName("else")
            if (elseBody && elseBody.type === "block_statement") {
                if (!this.processBlockStatements(elseBody, proc, file, null)) {
                    return false
                }
            }
        }

        // Handle nested blocks
        if (stmt.type === "block_statement") {
            return this.processBlockStatements(stmt, proc, file, null)
        }

        // Recursively search for variable declarations in complex statements
        return this.processComplexStatement(stmt, proc, file)
    }

    private processExpressionStatement(
        stmt: SyntaxNode,
        proc: FuncScopeProcessor,
        file: FuncFile,
    ): boolean {
        const expression = stmt.children[0]
        if (!expression) return true

        // Handle direct variable declaration as expression
        if (expression.type === "variable_declaration") {
            return this.processVariableDeclaration(expression, proc, file)
        }

        // Handle assignment expressions with variable declarations
        if (expression.type === "assignment_expression") {
            return this.processAssignmentExpression(expression, proc, file)
        }

        // Handle other expressions that might contain variable declarations
        return this.processVariableDeclarationsInExpression(expression, proc, file)
    }

    private processVariableDeclaration(
        decl: SyntaxNode,
        proc: FuncScopeProcessor,
        file: FuncFile,
    ): boolean {
        const variableField = decl.childForFieldName("variable")
        if (!variableField) return true

        // Handle simple identifier
        if (variableField.type === "identifier") {
            return proc.execute(new FuncVariable(variableField, file))
        }

        // Handle tuple destructuring: (int a, int b) = ...
        if (
            variableField.type === "tensor_expression" ||
            variableField.type === "tuple_expression"
        ) {
            const identifiers = this.extractIdentifiersFromExpression(variableField)
            for (const identifier of identifiers) {
                if (!proc.execute(new FuncVariable(identifier, file))) {
                    return false
                }
            }
        }

        return true
    }

    private processAssignmentExpression(
        assignment: SyntaxNode,
        proc: FuncScopeProcessor,
        file: FuncFile,
    ): boolean {
        // Look for variable declarations on the left side of assignment
        const leftSide = assignment.childForFieldName("left")
        if (leftSide && leftSide.type === "variable_declaration") {
            return this.processVariableDeclaration(leftSide, proc, file)
        }

        // Also check the right side for nested variable declarations
        const rightSide = assignment.childForFieldName("right")
        if (rightSide) {
            return this.processVariableDeclarationsInExpression(rightSide, proc, file)
        }

        return true
    }

    private processComplexStatement(
        stmt: SyntaxNode,
        proc: FuncScopeProcessor,
        file: FuncFile,
    ): boolean {
        // Use recursive visitor to find all variable declarations in complex statements
        let success = true
        RecursiveVisitor.visit(stmt, (node): boolean => {
            if (node.type === "variable_declaration") {
                if (!this.processVariableDeclaration(node, proc, file)) {
                    success = false
                    return false
                }
            }
            return true
        })
        return success
    }

    private processVariableDeclarationsInExpression(
        expression: SyntaxNode | null,
        proc: FuncScopeProcessor,
        file: FuncFile,
    ): boolean {
        if (!expression) return true

        let success = true
        // Recursively find variable_declaration nodes in complex expressions
        RecursiveVisitor.visit(expression, (node): boolean => {
            if (node.type === "variable_declaration") {
                if (!this.processVariableDeclaration(node, proc, file)) {
                    success = false
                    return false
                }
            }
            return true
        })
        return success
    }

    private extractIdentifiersFromExpression(node: SyntaxNode): SyntaxNode[] {
        const identifiers: SyntaxNode[] = []

        const visitNode = (n: SyntaxNode) => {
            if (n.type === "identifier") {
                identifiers.push(n)
            }
            for (const child of n.children) {
                if (child) {
                    visitNode(child)
                }
            }
        }

        visitNode(node)
        return identifiers
    }

    private processFileScope(proc: FuncScopeProcessor): boolean {
        const file = this.element.file

        RecursiveVisitor.visit(file.rootNode, (node): boolean => {
            if (node.type === "function_definition") {
                const func = new FuncFunction(node, file)
                if (!proc.execute(func)) return false
            }

            if (node.type === "global_var_declaration") {
                const globalVar = new FuncGlobalVariable(node, file)
                if (!proc.execute(globalVar)) return false
            }

            if (node.type === "constant_declaration") {
                const constant = new FuncConstant(node, file)
                if (!proc.execute(constant)) return false
            }

            return true
        })

        return true
    }

    private static declarationAstToNode(node: SyntaxNode, file: FuncFile): FuncNamedNode {
        if (node.type === "function_definition") {
            return new FuncFunction(node, file)
        }
        if (node.type === "parameter_declaration") {
            return new FuncParameter(node, file)
        }
        if (node.type === "global_var_declaration") {
            return new FuncGlobalVariable(node, file)
        }
        if (node.type === "constant_declaration") {
            return new FuncConstant(node, file)
        }
        if (node.type === "variable_declaration") {
            const nameNode = node.childForFieldName("variable")
            if (nameNode && nameNode.type === "identifier") {
                return new FuncVariable(nameNode, file)
            }
        }

        return new FuncNamedNode(node, file)
    }
}
