import {Cst, CstNode} from "../cst/cst-parser"
import {
    childByField,
    childIdxByField,
    childLeafIdxWithText,
    childrenByType,
    nonLeafChild,
    visit,
} from "../cst/cst-helpers"
import {CodeBuilder} from "./code-builder"
import {formatId, formatSeparatedList, getCommentsBetween, idText} from "./helpers"
import {formatAscription} from "./format-types"
import {formatStatements} from "./format-statements"
import {formatExpression} from "./format-expressions"
import {formatDocComments} from "./format-doc-comments"
import {formatComments, formatTrailingComments} from "./format-comments"

export const formatParameter = (code: CodeBuilder, param: CstNode): void => {
    // value: Foo
    // ^^^^^  ^^^
    // |      |
    // |      type
    // name
    const name = childByField(param, "name")
    const type = childByField(param, "type")
    if (!name || !type) {
        throw new Error("Invalid parameter")
    }
    code.apply(formatId, name)
    formatAscription(code, type)
}

export const formatFunction = (code: CodeBuilder, node: CstNode): void => {
    formatDocComments(code, node)

    // fun foo(value: Int): Bool {}
    //     ^^^ ^^^^^^^^^^ ^^^^^^ ^^
    //     |   |          |      |
    //     |   |          |      bodyOpt
    //     |   |          returnTypeOpt
    //     |   parameters
    //     name
    const name = childByField(node, "name")
    const parameters = childByField(node, "parameters")
    const returnTypeOpt = childByField(node, "returnType")
    const bodyOpt = childByField(node, "body")

    if (!name || !parameters) {
        throw new Error("Invalid function node")
    }

    // inline extends fun foo(self: Int) {}
    // ^^^^^^^^^^^^^^ this
    const attributes = childByField(node, "attributes")
    formatAttributes(code, attributes)

    code.add("fun").space().add(visit(name))

    formatSeparatedList(code, parameters, formatParameter)

    if (returnTypeOpt) {
        formatAscription(code, returnTypeOpt)
    }

    if (bodyOpt && bodyOpt.type === "FunctionDefinition") {
        code.space()
        const innerBody = childByField(bodyOpt, "body")
        if (innerBody) {
            formatStatements(code, innerBody)
        }
    } else {
        code.add(";")

        // process trailing comments after `;`
        const semicolonIndex = childLeafIdxWithText(bodyOpt, ";")
        formatTrailingComments(code, bodyOpt, semicolonIndex, true)
    }
}

function formatAttribute(code: CodeBuilder, attr: Cst): void {
    // get(100)
    // ^^^
    const attrName = childByField(attr, "name")
    if (!attrName) return

    if (attrName.type === "GetAttribute") {
        code.add("get")
        // get(0x1000) fun foo() {}
        //    ^^^^^^^^ this
        const methodIdOpt = childByField(attrName, "methodId")
        if (methodIdOpt) {
            // get(0x1000) fun foo() {}
            //     ^^^^^^ this
            const value = nonLeafChild(methodIdOpt)
            if (value) {
                code.add("(").apply(formatExpression, value).add(")")
            }
        }
    } else {
        code.add(idText(attr))
    }
    code.space()
}

export const formatNativeFunction = (code: CodeBuilder, node: CstNode): void => {
    formatDocComments(code, node)

    // @name("native_name")
    // ^^^^^ ^^^^^^^^^^^^^
    // |     |
    // |     nativeName
    // name
    //
    // inline native foo(param: Int): Int {}
    // ^^^^^^         ^^^ ^^^^^^^^^^ ^^^^^ ^^
    // attributesOpt  |   |          |     |
    //                |   |          |     body
    //                |   |          returnTypeOpt
    //                |   parameters
    //                name
    const name = childByField(node, "name")
    const nativeName = childByField(node, "nativeName")
    const parameters = childByField(node, "parameters")
    const returnTypeOpt = childByField(node, "returnType")
    const attributesOpt = childByField(node, "attributes")

    if (!name || !nativeName || !parameters) {
        throw new Error("Invalid native function declaration")
    }

    code.add("@name").add("(").apply(formatExpression, nativeName).add(")")

    // inline comments after `@name()`
    const comments = getCommentsBetween(node, nativeName, attributesOpt ?? name)
    formatComments(code, comments, true)

    code.newLine()

    formatAttributes(code, attributesOpt)

    code.add("native").space().apply(formatId, name)

    formatSeparatedList(code, parameters, formatParameter)

    if (returnTypeOpt) {
        formatAscription(code, returnTypeOpt)
    }

    code.add(";")

    // process trailing comments after `;`
    const semicolonIndex = childLeafIdxWithText(node, ";")
    formatTrailingComments(code, node, semicolonIndex, true)
}

export const formatAsmFunction = (code: CodeBuilder, node: CstNode): void => {
    formatDocComments(code, node)

    // asm(a, b) inline fun foo(param: Int): Int { FOO }
    //    ^^^^^^ ^^^^^^     ^^^ ^^^^^^^^^^ ^^^^^   ^^^^
    //    |      |          |   |          |       |
    //    |      |          |   |          |       instructions
    //    |      |          |   |          returnTypeOpt
    //    |      |          |   parameters
    //    |      |          name
    //    |      attributes
    //    shuffle
    const name = childByField(node, "name")
    const parameters = childByField(node, "parameters")
    const returnTypeOpt = childByField(node, "returnType")
    const attributes = childByField(node, "attributes")
    const shuffle = childByField(node, "shuffle")
    const instructions = childByField(node, "instructions")

    if (!name || !parameters || !instructions) {
        throw new Error("Invalid asm function declaration")
    }

    code.add("asm")

    if (shuffle) {
        formatAsmShuffle(code, shuffle)
    }

    code.space()
    formatAttributes(code, attributes)

    code.add("fun").space().apply(formatId, name)

    formatSeparatedList(code, parameters, formatParameter)

    if (returnTypeOpt) {
        formatAscription(code, returnTypeOpt)
    }

    code.space().add("{")

    // format instructions as is, without any changes
    const openBraceIndex = childLeafIdxWithText(node, "{")
    const instructionsIndex = childIdxByField(node, "instructions")
    for (let i = openBraceIndex + 1; i <= instructionsIndex; i++) {
        code.add(visit(node.children[i]))
    }

    code.add("}")

    // process trailing comments after `}`
    const braceIndex = childLeafIdxWithText(node, "}")
    formatTrailingComments(code, node, braceIndex, true)
}

function formatAsmShuffle(code: CodeBuilder, node: CstNode): void {
    // (a, b -> 1, 2)
    //  ^^^^ ^^^^^^^
    //  |    |
    //  |    to
    //  ids
    const ids = childByField(node, "ids")
    const to = childByField(node, "to")

    code.add("(")

    if (ids) {
        formatSeparatedList(
            code,
            ids,
            (code, id) => {
                code.apply(formatId, id)
            },
            {
                wrapperLeft: "",
                wrapperRight: "",
                startIndex: 0,
                endIndex: 0,
                separator: "",
            },
        )
    }

    if (to) {
        if (ids) {
            code.space()
        }
        code.add("->").space()
        formatSeparatedList(
            code,
            to,
            (code, value) => {
                formatExpression(code, value)
            },
            {
                wrapperLeft: "",
                wrapperRight: "",
                startIndex: 0,
                endIndex: 0,
                separator: "",
            },
        )
    }

    code.add(")")
}

function formatAttributes(code: CodeBuilder, attributes: CstNode | undefined): void {
    if (!attributes) return

    const attrs = childrenByType(attributes, "FunctionAttribute")
    for (const attr of attrs) {
        formatAttribute(code, attr)
    }
}

export const formatPrimitiveType = (code: CodeBuilder, node: CstNode): void => {
    formatDocComments(code, node)

    // primitive Foo;
    // ^^^^^^^^^ ^^^
    // |         |
    // |         name
    // keyword
    const name = childByField(node, "name")
    if (!name) {
        throw new Error("Invalid primitive type declaration")
    }

    code.add("primitive").space().apply(formatId, name).add(";")

    // process trailing comments after `;`
    const semicolonIndex = childLeafIdxWithText(node, ";")
    formatTrailingComments(code, node, semicolonIndex, true)
}

export function formatConstant(code: CodeBuilder, decl: CstNode): void {
    formatDocComments(code, decl)

    // const Foo : Int = 100;
    //       ^^^ ^^^^^ ^^^^^
    //       |   |     |
    //       |   |     bodyOpt
    //       |   type
    //       name
    const name = childByField(decl, "name")
    const type = childByField(decl, "type")
    const bodyOpt = childByField(decl, "body")

    if (!name || !type) {
        throw new Error("Invalid constant declaration")
    }

    const attributes = childByField(decl, "attributes")
    formatConstantAttributes(code, attributes)

    // const FOO: Int
    code.add("const").space().apply(formatId, name).apply(formatAscription, type)

    if (bodyOpt && bodyOpt.type === "ConstantDefinition") {
        // const Foo: Int = 100;
        //               ^^^^^^^ this
        code.space().add("=").space()
        // const Foo: Int = 100;
        //                  ^^^ this
        const value = nonLeafChild(bodyOpt)
        if (value) {
            code.apply(formatExpression, value).add(";")
        }
    } else if (!bodyOpt || bodyOpt.type === "ConstantDeclaration") {
        // const Foo: Int;
        //               ^ this
        code.add(";")
    }

    // process trailing comments after `;`
    const semicolonIndex = childLeafIdxWithText(bodyOpt, ";")
    formatTrailingComments(code, bodyOpt, semicolonIndex, true)
}

function formatConstantAttributes(code: CodeBuilder, attributes: CstNode | undefined): void {
    if (!attributes) return

    const attrs = childrenByType(attributes, "ConstantAttribute")
    for (const attr of attrs) {
        formatConstantAttribute(code, attr)
    }
}

function formatConstantAttribute(code: CodeBuilder, attr: Cst): void {
    const attrName = childByField(attr, "name")
    if (!attrName) return
    code.add(idText(attr)).space()
}
