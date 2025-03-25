import {Cst, CstNode} from "../cst/cst-parser"
import {CodeBuilder} from "./code-builder"
import {
    formatFunction,
    formatNativeFunction,
    formatAsmFunction,
    formatPrimitiveType,
    formatConstant,
} from "./format-declarations"
import {formatStatement} from "./format-statements"
import {formatExpression} from "./format-expressions"
import {visit, childByField, trailingNewlines} from "../cst/cst-helpers"
import {formatContract, formatTrait} from "./format-contracts"
import {formatMessage, formatStruct} from "./format-structs"
import {formatImport} from "./format-imports"
import {containsSeveralNewlines} from "./helpers"

export type FormatRule = (code: CodeBuilder, node: CstNode) => void
export type FormatStatementRule = (code: CodeBuilder, node: CstNode, needSemicolon: boolean) => void

export const format = (node: Cst): string => {
    const code = new CodeBuilder()
    formatNode(code, node)
    return code.toString()
}

const formatNode = (code: CodeBuilder, node: Cst): void => {
    if (node.$ === "leaf") {
        code.add(node.text)
        return
    }

    switch (node.type) {
        case "Root": {
            if (node.children.length === 0) {
                return
            }

            let needNewLine = false
            node.children.forEach((child, index) => {
                if (child.$ === "leaf") {
                    if (containsSeveralNewlines(child.text)) {
                        needNewLine = true
                    }
                    return
                }

                if (needNewLine) {
                    code.newLine()
                }

                if (child.type === "Comment") {
                    code.add(visit(child))
                    code.newLine()
                    return
                }

                formatNode(code, child)
                if (index < node.children.length - 2) {
                    code.newLine()
                }
            })
            code.trimNewlines().newLine()
            break
        }
        case "Module": {
            const importsNode = childByField(node, "imports")
            if (importsNode) {
                const imports = importsNode.children
                for (const item of imports) {
                    if (item.$ === "node" && item.type === "Import") {
                        formatImport(code, item)
                        code.newLine()
                    }
                }

                code.newLine()
            }

            const itemsNode = childByField(node, "items")
            if (!itemsNode) {
                break
            }

            let needNewLine = false

            const items = itemsNode.children
            items.forEach((item, index) => {
                if (item.$ === "leaf") {
                    if (containsSeveralNewlines(item.text)) {
                        needNewLine = true
                    }
                    return
                }

                if (item.type === "Comment") {
                    // floating comment
                    code.add(visit(item))
                    code.newLine()
                    return
                }

                if (needNewLine) {
                    code.newLine()
                    needNewLine = false
                }
                formatNode(code, item)
                if (index < items.length - 1) {
                    code.newLine()
                }

                const newlines = trailingNewlines(item)
                if (newlines > 1) {
                    code.newLine()
                }
            })
            break
        }

        case "PrimitiveTypeDecl": {
            formatPrimitiveType(code, node)
            break
        }
        case "$Function": {
            formatFunction(code, node)
            break
        }
        case "NativeFunctionDecl": {
            formatNativeFunction(code, node)
            break
        }
        case "AsmFunction": {
            formatAsmFunction(code, node)
            break
        }
        case "Contract": {
            formatContract(code, node)
            break
        }
        case "Trait": {
            formatTrait(code, node)
            break
        }
        case "StructDecl": {
            formatStruct(code, node)
            break
        }
        case "MessageDecl": {
            formatMessage(code, node)
            break
        }
        case "Constant": {
            formatConstant(code, node)
            break
        }
        case "Comment": {
            code.add(visit(node).trim())
            break
        }
        case "StatementDestruct":
        case "StatementRepeat":
        case "StatementUntil":
        case "StatementTry":
        case "StatementForEach":
        case "StatementLet":
        case "StatementReturn":
        case "StatementExpression":
        case "StatementAssign":
        case "StatementCondition":
        case "StatementWhile":
        case "StatementBlock": {
            formatStatement(code, node, true)
            break
        }
        default: {
            if (node.group === "expression") {
                formatExpression(code, node)
            } else {
                code.add(visit(node).trim())
            }
        }
    }
}
