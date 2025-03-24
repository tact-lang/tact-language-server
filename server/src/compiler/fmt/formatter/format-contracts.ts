import {Cst, CstNode} from "../cst/cst-parser"
import {
    childByField,
    childIdxByField,
    childIdxByType,
    childLeafIdxWithText,
    childrenByType,
    nonLeafChild,
    visit,
} from "../cst/cst-helpers"
import {CodeBuilder} from "./code-builder"
import {
    containsSeveralNewlines,
    declName,
    formatId,
    formatSeparatedList,
    idText,
    trailingNewlines,
} from "./helpers"
import {formatFunction, formatParameter} from "./format-declarations"
import {formatStatements} from "./format-statements"
import {formatAscription} from "./format-types"
import {formatExpression} from "./format-expressions"
import {formatDocComments} from "./format-doc-comments"
import {formatComment, formatTrailingComments} from "./format-comments"

export function formatContract(code: CodeBuilder, node: CstNode): void {
    formatDocComments(code, node)

    formatContractTraitAttributes(code, node)
    code.add("contract").space().add(declName(node))
    formatContractParameters(code, node)
    formatInheritedTraits(code, node)
    formatContractTraitBody(code, node, (code, decl) => {
        switch (decl.type) {
            case "ContractInit":
                formatContractInit(code, decl)
                break
            case "Receiver":
                formatReceiver(code, decl)
                break
            case "$Function":
                formatFunction(code, decl)
                break
            case "Constant":
                formatConstant(code, decl)
                break
            case "FieldDecl":
                formatFieldDecl(code, decl, true)
                break
            default:
                throw new Error(`Unknown contract declaration type: ${decl.type}`)
        }
    })
}

export function formatTrait(code: CodeBuilder, node: CstNode): void {
    formatDocComments(code, node)

    formatContractTraitAttributes(code, node)
    code.add("trait").space().add(declName(node))
    formatInheritedTraits(code, node)
    formatContractTraitBody(code, node, (code, decl) => {
        switch (decl.type) {
            case "Receiver":
                formatReceiver(code, decl)
                break
            case "$Function":
                formatFunction(code, decl)
                break
            case "Constant":
                formatConstant(code, decl)
                break
            case "FieldDecl":
                formatFieldDecl(code, decl, true)
                break
            default:
                throw new Error(`Unknown trait declaration type: ${decl.type}`)
        }
    })
}

function formatContractInit(code: CodeBuilder, decl: CstNode): void {
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

function formatReceiver(code: CodeBuilder, decl: CstNode): void {
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
        code.apply(formatExpression, value).add(";")
    } else if (!bodyOpt || bodyOpt.type === "ConstantDeclaration") {
        // const Foo: Int;
        //               ^ this
        code.add(";")
    }

    // process trailing comments after `;`
    const semicolonIndex = childLeafIdxWithText(bodyOpt, ";")
    formatTrailingComments(code, bodyOpt, semicolonIndex)
}

function formatConstantAttributes(code: CodeBuilder, attributes: CstNode | undefined) {
    if (!attributes) return

    const attrs = childrenByType(attributes, "ConstantAttribute")
    for (const attr of attrs) {
        formatConstantAttribute(code, attr)
    }
}

function formatConstantAttribute(code: CodeBuilder, attr: Cst) {
    const attrName = childByField(attr, "name")
    if (!attrName) return
    code.add(`${idText(attr)}`).space()
}

export function formatFieldDecl(code: CodeBuilder, decl: CstNode, needSemicolon: boolean): void {
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
        //  = 100
        code.space().add("=").space().apply(formatExpression, value)
    }
    if (needSemicolon) {
        code.add(";")
    }

    // since `;` is not a part of the field, we process all comments after type
    //
    // foo: Int; // 100
    //      ^^^ after this type
    const endIndex = childIdxByField(decl, "type")
    formatTrailingComments(code, decl, endIndex)
}

function formatContractTraitAttribute(attr: Cst, code: CodeBuilder) {
    const name = childByField(attr, "name")
    if (!name) return
    code.add("@interface").add("(").apply(formatExpression, name).add(")")
}

function formatContractTraitAttributes(code: CodeBuilder, node: CstNode): void {
    // @interface("name")
    // ^^^^^^^^^^^^^^^^^^ this
    // contract Foo {}
    const attributesNode = childByField(node, "attributes")
    if (!attributesNode) return

    const attributes = childrenByType(attributesNode, "ContractAttribute")
    attributes.forEach((attr, i) => {
        formatContractTraitAttribute(attr, code)
        if (i < attributes.length - 1) {
            code.newLine()
        }
    })
    if (attributes.length > 0) {
        code.newLine()
    }
}

function formatInheritedTraits(code: CodeBuilder, node: CstNode): void {
    // contract Foo with Bar, Baz {}
    //              ^^^^^^^^^^^^^ this
    const traitsNode = childByField(node, "traits")
    if (!traitsNode) return

    code.space().add("with").space()

    // ["with", " ", "Bar", ", ", "Baz"]
    //               ^ starts from here
    const namesIndex = childIdxByType(traitsNode, "Id")

    formatSeparatedList(
        code,
        traitsNode,
        (code, trait) => {
            code.apply(formatId, trait)
        },
        {
            wrapperLeft: "",
            wrapperRight: "",
            startIndex: namesIndex,
            endIndex: 0,
        },
    )
}

function formatContractParameters(code: CodeBuilder, node: CstNode): void {
    // contract Foo(value: Int) {}
    //             ^^^^^^^^^^^^ this
    const params = childByField(node, "parameters")
    if (!params) return
    formatSeparatedList(code, params, formatParameter)
}

function formatContractTraitBody(
    code: CodeBuilder,
    node: CstNode,
    formatDeclaration: (code: CodeBuilder, decl: CstNode) => void,
): void {
    const children = node.children

    // contract or trait can contain only comments, so we need to handle this case properly
    const hasComments = children.find(it => it.$ === "node" && it.type === "Comment")

    const declarationsNode = childByField(node, "declarations")
    if (!declarationsNode && !hasComments) {
        code.space().add("{}")
        return
    }

    code.space().add("{").newLine().indent()

    const declarations = declarationsNode?.children ?? []

    let needNewLine = false
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
        }

        if (decl.type === "Comment") {
            formatComment(code, decl)
        } else {
            formatDeclaration(code, decl)
        }

        code.newLine()

        const newlines = trailingNewlines(decl)
        if (!needNewLine && containsSeveralNewlines(newlines)) {
            code.newLine()
        }
    }

    if (!declarationsNode) {
        // empty contract
        const openBraceIndex = childLeafIdxWithText(node, "{")
        const closeBraceIndex = childLeafIdxWithText(node, "}")

        const comments = node.children
            .slice(openBraceIndex + 1, closeBraceIndex)
            .filter(it => it.$ === "node" && it.type === "Comment")
        comments.forEach(child => {
            code.add(visit(child).trim())
            code.newLine()
        })
    }

    code.dedent().add("}")
}
