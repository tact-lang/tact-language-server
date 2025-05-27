//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import {CstNode} from "../cst/cst-parser"
import {
    childByField,
    childIdxByType,
    childLeafIdxWithText,
    childrenByType,
    containsComments,
    filterComments,
    trailingNewlines,
    visit,
} from "../cst/cst-helpers"
import {CodeBuilder} from "./code-builder"
import {containsSeveralNewlines, declName, formatId, formatSeparatedList} from "./helpers"
import {formatConstant, formatFunction, formatParameter} from "./format-declarations"
import {formatStatements} from "./format-statements"
import {formatExpression} from "./format-expressions"
import {formatDocComments} from "./format-doc-comments"
import {formatComment, formatLineComments, formatTrailingComments} from "./format-comments"
import {formatField} from "./format-structs"
import {FormatRule} from "@server/compiler/fmt/formatter/formatter"

export const formatContract: FormatRule = (code, node) => {
    formatDocComments(code, node)

    formatContractTraitAttributes(code, node)
    code.add("contract").space().add(declName(node))
    formatContractParameters(code, node)
    formatInheritedTraits(code, node)
    formatContractTraitBody(code, node, (code, decl) => {
        switch (decl.type) {
            case "ContractInit": {
                formatContractInit(code, decl)
                break
            }
            case "Receiver": {
                formatReceiver(code, decl)
                break
            }
            case "$Function": {
                formatFunction(code, decl)
                break
            }
            case "Constant": {
                formatConstant(code, decl)
                break
            }
            case "FieldDecl": {
                formatField(code, decl, true)
                break
            }
            default: {
                throw new Error(`Unknown contract declaration type: ${decl.type}`)
            }
        }
    })
}

export const formatTrait: FormatRule = (code, node) => {
    formatDocComments(code, node)

    formatContractTraitAttributes(code, node)
    code.add("trait").space().add(declName(node))
    formatInheritedTraits(code, node)
    formatContractTraitBody(code, node, (code, decl) => {
        switch (decl.type) {
            case "Receiver": {
                formatReceiver(code, decl)
                break
            }
            case "$Function": {
                formatFunction(code, decl)
                break
            }
            case "Constant": {
                formatConstant(code, decl)
                break
            }
            case "FieldDecl": {
                formatField(code, decl, true)
                break
            }
            default: {
                throw new Error(`Unknown trait declaration type: ${decl.type}`)
            }
        }
    })
}

const formatContractInit: FormatRule = (code, decl) => {
    formatDocComments(code, decl)

    code.add("init")

    // init(foo: Int) {}
    //      ^^^^^^^^
    const paramsOpt = childByField(decl, "parameters")
    if (paramsOpt) {
        formatSeparatedList(code, paramsOpt, formatParameter)
    }

    const body = childByField(decl, "body")
    if (!body) {
        throw new Error("Invalid contract init declaration")
    }

    code.space()
    formatStatements(code, body)
}

const formatReceiver: FormatRule = (code, decl) => {
    formatDocComments(code, decl)

    // receive(param: Message) {}
    // ^^^^^^^ ^^^^^^^^^^^^^^  ^^
    // |       |               |
    // |       |               body
    // |       paramOpt
    // type
    const type = childByField(decl, "type")
    const paramOpt = childByField(decl, "param")
    const body = childByField(decl, "body")

    if (!type || !body) {
        throw new Error("Invalid receiver declaration")
    }

    // receive/external/bounced
    const receiverKind = childByField(type, "name")
    if (!receiverKind) {
        throw new Error("Invalid receiver type")
    }

    code.add(visit(receiverKind))

    if (paramOpt) {
        code.add("(")
        if (paramOpt.type === "Parameter") {
            // receive(param: Slice) {}
            //         ^^^^^^^^^^^^ this
            formatParameter(code, paramOpt)
        } else if (paramOpt.type === "StringLiteral") {
            // receive("hello") {}
            //         ^^^^^^^ this
            formatExpression(code, paramOpt)
        }
        code.add(")")
    } else {
        code.add("()")
    }
    code.space()
    formatStatements(code, body)
}

const formatContractTraitAttribute: FormatRule = (code, attr) => {
    const name = childByField(attr, "name")
    if (!name) return
    code.add("@interface").add("(").apply(formatExpression, name).add(")")
}

const formatContractTraitAttributes: FormatRule = (code, node) => {
    // @interface("name")
    // ^^^^^^^^^^^^^^^^^^ this
    // contract Foo {}
    const attributesNode = childByField(node, "attributes")
    if (!attributesNode) return

    const attributes = childrenByType(attributesNode, "ContractAttribute")
    attributes.forEach((attr, i) => {
        formatContractTraitAttribute(code, attr)
        if (i < attributes.length - 1) {
            code.newLine()
        }
    })
    if (attributes.length > 0) {
        code.newLine()
    }
}

const formatInheritedTraits: FormatRule = (code, node) => {
    // contract Foo with Bar, Baz {}
    //              ^^^^^^^^^^^^^ this
    const traitsNode = childByField(node, "traits")
    if (!traitsNode) return

    code.space().add("with")

    // ["with", " ", "Bar", ", ", "Baz"]
    //               ^ starts from here
    const namesIndex = childIdxByType(traitsNode, "Id")

    formatSeparatedList(code, traitsNode, formatId, {
        wrapperLeft: "",
        wrapperRight: "",
        startIndex: namesIndex,
        endIndex: 0,
        spaceBeforeIfNotMultiline: true,
    })
}

const formatContractParameters: FormatRule = (code, node) => {
    // contract Foo(value: Int) {}
    //             ^^^^^^^^^^^^ this
    const params = childByField(node, "parameters")
    if (!params) return
    formatSeparatedList(code, params, formatParameter)
}

function formatContractTraitBody(
    code: CodeBuilder,
    node: CstNode,
    formatDeclaration: FormatRule,
): void {
    const endIndex = childLeafIdxWithText(node, "}")
    const children = node.children.slice(0, endIndex)

    // contract or trait can contain only comments, so we need to handle this case properly
    const hasComments = containsComments(children)

    const declarationsNode = childByField(node, "declarations")
    if (!declarationsNode && !hasComments) {
        code.space().add("{}")

        // format inline comments after `}`
        formatTrailingComments(code, node, endIndex, true)
        return
    }

    code.space().add("{").newLine().indent()

    const declarations = declarationsNode?.children ?? []

    let needNewLine = false
    let previousDeclarationType: undefined | string = undefined
    for (const decl of declarations) {
        if (decl.$ === "leaf") {
            if (containsSeveralNewlines(decl.text)) {
                needNewLine = true
            }
            continue
        }

        if (needNewLine) {
            code.newLine()
            needNewLine = false
            previousDeclarationType = undefined // don't need to add extra newline
        }

        if (decl.type === "Comment") {
            formatComment(code, decl)
        } else {
            const otherKind = previousDeclarationType !== decl.type
            const afterNonFieldOrConstant =
                previousDeclarationType !== "FieldDecl" && previousDeclarationType !== "Constant"

            if (previousDeclarationType !== undefined && (otherKind || afterNonFieldOrConstant)) {
                // add extra new line between declarations except fields and constants
                code.newLine()
            }

            formatDeclaration(code, decl)
            previousDeclarationType = decl.type
        }

        code.newLine()

        const newlines = trailingNewlines(decl)
        if (newlines > 1) {
            code.newLine()
            previousDeclarationType = undefined // don't need to add extra newline
        }
    }

    if (!declarationsNode) {
        // empty contract
        const openBraceIndex = childLeafIdxWithText(node, "{")
        const closeBraceIndex = childLeafIdxWithText(node, "}")

        // output comments between `{` and `}`
        const bodyNodes = node.children.slice(openBraceIndex + 1, closeBraceIndex)
        const comments = filterComments(bodyNodes)
        formatLineComments(code, comments)
    }

    code.trimNewlines().newLine()

    code.dedent().add("}")

    // format inline comments after `}`
    formatTrailingComments(code, node, endIndex, true)
}
