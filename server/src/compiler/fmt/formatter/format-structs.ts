import {
    childByField,
    childIdxByField,
    childLeafWithText,
    nonLeafChild,
    visit,
} from "../cst/cst-helpers"
import {containsSeveralNewlines, declName, formatId} from "./helpers"
import {formatExpression} from "./format-expressions"
import {formatDocComments} from "./format-doc-comments"
import {FormatRule, FormatStatementRule} from "./formatter"
import {formatAscription} from "./format-types"
import {formatTrailingComments} from "./format-comments"

export const formatStruct: FormatRule = (code, node) => {
    formatDocComments(code, node)
    code.add("struct").space().add(declName(node))
    formatFields(code, node)
}

export const formatMessage: FormatRule = (code, node) => {
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

const formatFields: FormatRule = (code, node) => {
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
        formatField(code, firstField, false)
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
            for (const field of fields) {
                if (field.$ === "leaf") {
                    if (containsSeveralNewlines(field.text)) {
                        needNewlineBetween = true
                    }
                    continue
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
                    formatField(code, field, true)
                    needNewline = true
                }
            }

            if (needNewline) {
                code.newLine()
            }
        }
    })

    code.dedent().add("}")
}

export const formatField: FormatStatementRule = (code, decl, needSemicolon) => {
    formatDocComments(code, decl)

    // foo : Int = 100;
    // ^^^ ^^^^^   ^^^
    // |   |       |
    // |   |       initOpt
    // |   type
    // name
    const name = childByField(decl, "name")
    const type = childByField(decl, "type")
    const initOpt = childByField(decl, "expression")

    if (!name || !type) {
        throw new Error("Invalid field declaration")
    }

    // foo: Int
    code.apply(formatId, name).apply(formatAscription, type)

    if (initOpt) {
        // foo: Int = 100;
        //            ^^^ this
        const value = nonLeafChild(initOpt)
        if (value) {
            //  = 100
            code.space().add("=").space().apply(formatExpression, value)
        }
    }
    if (needSemicolon) {
        code.add(";")
    }

    // since `;` is not a part of the field, we process all comments after type
    //
    // foo: Int; // 100
    //      ^^^ after this type
    const endIndex = childIdxByField(decl, "type")
    formatTrailingComments(code, decl, endIndex, true)
}
