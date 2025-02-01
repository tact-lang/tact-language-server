import {Refactoring, RefactoringContext, RefactoringResult} from "./Refactoring"
import * as lsp from "vscode-languageserver"
import {Node as SyntaxNode} from "web-tree-sitter"
import {asLspRange} from "../utils/position"
import {Logger} from "../utils/logger"

export class ExtractVariableRefactoring extends Refactoring {
    async execute(context: RefactoringContext): Promise<RefactoringResult> {
        const {file, selection} = context
        const logger = Logger.getInstance()

        const expression = this.findExpressionInRange(file.rootNode, selection)
        if (!expression) {
            return {
                edit: {changes: {}},
                error: "No valid expression found in selection",
            }
        }

        if (!this.isExtractable(expression)) {
            return {
                edit: {changes: {}},
                error: "Selected expression cannot be extracted",
            }
        }

        if (!this.isValidContext(expression)) {
            return {
                edit: {changes: {}},
                error: "Cannot extract variable in this context",
            }
        }

        const insertPosition = this.findInsertPosition(expression)
        if (!insertPosition) {
            return {
                edit: {changes: {}},
                error: "Cannot find suitable position for variable declaration",
            }
        }

        const varName = this.generateVariableName(expression)

        const changes: {[uri: string]: lsp.TextEdit[]} = {}
        changes[file.uri] = [
            {
                range: {
                    start: {
                        line: insertPosition.line,
                        character: 0,
                    },
                    end: insertPosition,
                },
                newText: this.formatNewText(varName, expression.text, insertPosition.character),
            },
            {
                range: asLspRange(expression),
                newText: varName,
            },
        ]

        logger.info(`Extracting variable "${varName}" from expression "${expression.text}"`)

        return {
            edit: {changes},
        }
    }

    private findExpressionInRange(root: SyntaxNode, range: lsp.Range): SyntaxNode | null {
        const startPoint = {
            row: range.start.line,
            column: range.start.character,
        }
        const endPoint = {
            row: range.end.line,
            column: range.end.character,
        }

        let node: SyntaxNode | null = root.descendantForPosition(startPoint)
        if (!node) return null

        while (node) {
            const nodeStart = node.startPosition
            const nodeEnd = node.endPosition

            const containsSelection =
                (nodeStart.row < startPoint.row ||
                    (nodeStart.row === startPoint.row && nodeStart.column <= startPoint.column)) &&
                (nodeEnd.row > endPoint.row ||
                    (nodeEnd.row === endPoint.row && nodeEnd.column >= endPoint.column))

            if (this.isExpression(node) && containsSelection) {
                return node
            }

            node = node.parent
        }

        return null
    }

    private isExpression(node: SyntaxNode): boolean {
        return [
            "binary_expression", // a + b, a * b
            "unary_expression", // -a, !b
            "static_call_expression", // foo(), bar(1, 2)
            "method_call_expression", // foo(), bar(1, 2)
            "member_expression", // a.b, self.value
            "literal_expression", // 123, "abc", true
            "identifier", // someVar
            "self", // self
            "parenthesized_expression", // (a + b)
            "array_expression", // [1, 2, 3]
            "struct_expression", // Point{x: 1, y: 2}
            "as_expression", // msg as Message
            "init_expression", // init(123)
            "conditional_expression", // a ? b : c
        ].includes(node.type)
    }

    private isExtractable(node: SyntaxNode): boolean {
        if (
            node.type === "identifier" ||
            node.type === "self" ||
            (node.parent?.type === "member_expression" &&
                node.parent.childForFieldName("property") === node)
        ) {
            return false
        }

        return this.isExpression(node)
    }

    private findInsertPosition(node: SyntaxNode): lsp.Position | null {
        let current = node.parent
        while (current) {
            switch (current.type) {
                case "function_body":
                case "block":
                case "receive_body":
                case "bounced_body":
                case "if_statement":
                case "else_clause":
                case "while_statement":
                case "repeat_statement":
                case "do_statement": {
                    let statements = current.children
                    if (current.type === "if_statement") {
                        statements = current.childForFieldName("consequence")?.children ?? []
                    }

                    const nodeStart = node.startPosition
                    for (let i = 0; i < statements.length; i++) {
                        const stmt = statements[i]
                        if (!stmt) continue

                        const stmtStart = stmt.startPosition

                        if (
                            stmtStart.row > nodeStart.row ||
                            (stmtStart.row === nodeStart.row && stmtStart.column > nodeStart.column)
                        ) {
                            const targetStmt = statements[i - 1] || stmt
                            return {
                                line: targetStmt.startPosition.row,
                                character: targetStmt.startPosition.column,
                            }
                        }
                    }

                    const lastStmt = statements[statements.length - 1]
                    if (lastStmt) {
                        return {
                            line: lastStmt.startPosition.row,
                            character: 0,
                        }
                    }
                }
            }
            current = current.parent
        }
        return null
    }

    private generateVariableName(node: SyntaxNode): string {
        const baseNames: {[key: string]: (node: SyntaxNode) => string} = {
            binary_expression: (node: SyntaxNode) => {
                const op = node.childForFieldName("operator")?.text
                switch (op) {
                    case "+":
                    case "-":
                    case "*":
                    case "/":
                        return "result"
                    case "==":
                    case "!=":
                    case "<":
                    case ">":
                    case "<=":
                    case ">=":
                        return "isValid"
                    case "&&":
                        return "isAllValid"
                    case "||":
                        return "isAnyValid"
                    default:
                        return "result"
                }
            },

            call_expression: (node: SyntaxNode) => {
                const callee = node.childForFieldName("function")
                if (callee?.type === "member_expression") {
                    const method = callee.childForFieldName("property")?.text
                    return method ? method + "Result" : "result"
                }
                return "result"
            },

            member_expression: (node: SyntaxNode) => {
                const property = node.childForFieldName("property")?.text
                return property || "result"
            },

            literal_expression: (node: SyntaxNode) => {
                switch (node.childForFieldName("kind")?.text) {
                    case "number":
                        return "num"
                    case "string":
                        return "str"
                    case "boolean":
                        return "flag"
                    default:
                        return "result"
                }
            },

            struct_expression: (node: SyntaxNode) => {
                const type = node.childForFieldName("type")?.text
                return type ? type.toLowerCase() : "obj"
            },

            array_expression: () => "items",
            conditional_expression: () => "result",
            as_expression: () => "converted",
            init_expression: () => "initialized",
        }

        const generator = baseNames[node.type]
        const baseName = typeof generator === "function" ? generator(node) : generator || "result"

        // TODO: Проверить уникальность имени в текущей области видимости
        return baseName
    }

    private isValidContext(node: SyntaxNode): boolean {
        let current: SyntaxNode | null = node
        while (current) {
            switch (current.type) {
                case "global_function":
                case "receive_function":
                case "bounced_function":
                    return true
                case "contract":
                case "trait":
                case "struct":
                case "global_statement":
                    return false
            }
            current = current.parent
        }
        return false
    }

    private formatNewText(varName: string, expression: string, indentation: number): string {
        const indent = " ".repeat(indentation)
        return `${indent}let ${varName} = ${expression};\n${indent}`
    }
}
