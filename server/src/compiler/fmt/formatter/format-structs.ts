import {CstNode} from "../cst/cst-parser"
import {childByField, childLeafWithText, nonLeafChild, visit} from "../cst/cst-helpers"
import {CodeBuilder} from "./code-builder"
import {containsSeveralNewlines, declName} from "./helpers"
import {formatExpression} from "./format-expressions"
import {formatFieldDecl} from "./format-contracts"
import {formatDocComments} from "./format-doc-comments"

export function formatStruct(code: CodeBuilder, node: CstNode): void {
    formatDocComments(code, node)
    code.add("struct").space().add(declName(node))
    formatFields(code, node)
}

export function formatMessage(code: CodeBuilder, node: CstNode): void {
    formatDocComments(code, node)
    code.add("message")

    // message(0x100) Foo {}
    //         ^^^^^ this
    const opcodeOpt = childByField(node, "opcode")
    if (opcodeOpt) {
        code.add("(")
        const expression = nonLeafChild(opcodeOpt)
        if (expression) {
            formatExpression(code, expression)
        }
        code.add(")")
    }

    code.space().add(declName(node))
    formatFields(code, node)
}

function formatFields(code: CodeBuilder, node: CstNode): void {
    const children = node.children

    // struct can contain only comments, so we need to handle this case properly
    const hasComments = children.find(it => it.$ === "node" && it.type === "Comment")

    const fieldsNode = childByField(node, "fields")
    if ((!fieldsNode || fieldsNode.children.length === 0) && !hasComments) {
        code.space().add("{}")
        return
    }

    const fields =
        fieldsNode?.children.filter(it => it.$ === "node" && it.type === "FieldDecl") ?? []
    const firstField = fields.at(0)

    const oneLiner =
        fields.length === 1 &&
        firstField &&
        childLeafWithText(fieldsNode, ";") === undefined &&
        !hasComments

    if (oneLiner && firstField.$ === "node") {
        code.space().add("{").space()
        formatFieldDecl(code, firstField, false)
        code.space().add("}")
        return
    }

    code.space().add("{").newLine().indent()

    children.forEach(child => {
        if (child.$ === "leaf") return

        if (child.type === "Comment") {
            code.add(visit(child).trim())
            code.newLine()
        }

        if (child.field === "fields") {
            const fields = child.children

            let needNewline = false
            let needNewlineBetween = false
            fields.forEach(field => {
                if (field.$ === "leaf") {
                    if (containsSeveralNewlines(field.text)) {
                        needNewlineBetween = true
                    }
                    return
                }

                if (needNewlineBetween) {
                    code.newLine()
                    needNewlineBetween = false
                }

                if (field.type === "Comment") {
                    if (needNewline) {
                        code.add(" ")
                    }
                    code.add(visit(field).trim())
                    code.newLine()
                    needNewline = false
                } else if (field.type === "FieldDecl") {
                    if (needNewline) {
                        code.newLine()
                    }
                    formatFieldDecl(code, field, true)
                    needNewline = true
                }
            })

            if (needNewline) {
                code.newLine()
            }
        }
    })

    code.dedent().add("}")
}
