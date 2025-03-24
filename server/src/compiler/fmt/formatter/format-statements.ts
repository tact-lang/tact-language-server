import {Cst, CstNode} from "../cst/cst-parser"
import {
    childByField,
    childByType,
    childIdxByField,
    childLeafIdxWithText,
    childLeafWithText,
    nonLeafChild,
    visit,
} from "../cst/cst-helpers"
import {CodeBuilder} from "./code-builder"
import {formatExpression} from "./format-expressions"
import {formatAscription, formatType} from "./format-types"
import {containsSeveralNewlines, formatId, formatSeparatedList, getCommentsBetween} from "./helpers"
import {formatTrailingComments, formatInlineComments} from "./format-comments"

function trailingNewlines(node: Cst): string {
    if (node.$ === "leaf") return ""

    let lastChild = node.children.at(-1)
    if (lastChild && lastChild.$ === "node" && lastChild.type === "trueBranch") {
        lastChild = lastChild.children.at(-1)
    }
    if (lastChild && lastChild.$ === "node" && lastChild.type === "falseBranch") {
        const falseBranch = childByType(lastChild, "FalseBranch")
        if (falseBranch) {
            const innerBody = childByField(falseBranch, "body")
            if (innerBody) {
                return trailingNewlines(innerBody)
            }
        }

        const falseCondition = childByType(lastChild, "StatementCondition")
        if (falseCondition) {
            return trailingNewlines(falseCondition)
        }
    }
    if (
        node.type === "StatementWhile" ||
        node.type === "StatementForEach" ||
        node.type === "StatementRepeat"
    ) {
        const body = childByField(node, "body")
        if (body) {
            lastChild = body.children.at(-1)
        }
    }
    if (lastChild && lastChild.$ === "leaf" && lastChild.text.includes("\n")) {
        return lastChild.text
    }
    return ""
}

function semicolonStatement(node: CstNode): boolean {
    return (
        node.type === "StatementLet" ||
        node.type === "StatementDestruct" ||
        node.type === "StatementReturn" ||
        node.type === "StatementExpression" ||
        node.type === "StatementAssign" ||
        node.type === "StatementUntil"
    )
}

function canBeSingleLine(node: CstNode): boolean {
    const hasInlineComments = node.children.some(
        it => it.$ === "node" && it.type === "Comment" && visit(it).startsWith("//"),
    )
    if (hasInlineComments) {
        return false
    }
    if (node.type === "StatementUntil") {
        return false
    }
    if (node.type === "StatementReturn") {
        const expr = childByField(node, "expression")
        if (expr && expr.type === "StructInstance") {
            return false
        }
    }
    return true
}

export function singleLineStatement(node: CstNode): boolean {
    const endIndex = childLeafIdxWithText(node, "}")
    const statements = node.children.slice(0, endIndex).filter(it => it.$ === "node")
    if (statements.length === 0) {
        return false
    }

    const comments = statements.filter(it => it.type === "Comment")
    return (
        statements.length === 1 &&
        childLeafWithText(statements[0], ";") === undefined &&
        semicolonStatement(statements[0]) &&
        canBeSingleLine(statements[0]) &&
        comments.length === 0
    )
}

export const formatStatements = (code: CodeBuilder, node: CstNode): void => {
    const endIndex = childLeafIdxWithText(node, "}")
    const statements = node.children.slice(0, endIndex).filter(it => it.$ === "node")
    if (statements.length === 0) {
        code.add("{}")
        formatTrailingComments(code, node, endIndex)
        return
    }

    if (singleLineStatement(node)) {
        code.add("{").space()
        formatStatement(code, statements[0], false)
        code.space().add("}")
        return
    }

    code.add("{")

    let needNewLine = false
    let seenFirstNewline = false

    for (let i = 0; i < endIndex; i++) {
        const statement = node.children[i]
        if (statement.$ === "leaf") {
            if (!seenFirstNewline && statement.text.includes("\n")) {
                // add initial new line after `{`
                code.newLine().indent()
                seenFirstNewline = true
                continue
            }

            // don't add extra leading line
            if (i !== 1 && containsSeveralNewlines(statement.text)) {
                needNewLine = true
            }
            continue
        }

        if (needNewLine) {
            code.newLine()
            needNewLine = false
        }

        if (statement.type === "Comment") {
            if (!seenFirstNewline) {
                // found inline comment after `{`, need to add space before it
                code.space()
            }
            code.add(visit(statement).trim())

            if (!seenFirstNewline) {
                // don't add new line for inline comment
                continue
            }
        } else if (statement.group === "statement") {
            if (!seenFirstNewline) {
                // add initial new line after `{`
                code.newLine().indent()
                seenFirstNewline = true
            }

            formatStatement(code, statement, true)
            const newlines = trailingNewlines(statement)
            if (containsSeveralNewlines(newlines)) {
                needNewLine = true
            }
        }

        code.newLine()
    }

    code.dedent().add("}")

    formatTrailingComments(code, node, endIndex)
}

export const formatStatement = (code: CodeBuilder, node: Cst, needSemicolon: boolean): void => {
    if (node.$ !== "node") {
        throw new Error("Expected node in statement")
    }

    switch (node.type) {
        case "StatementLet": {
            formatLetStatement(code, node, needSemicolon)
            break
        }
        case "StatementDestruct": {
            formatDestructStatement(code, node, needSemicolon)
            break
        }
        case "StatementReturn": {
            formatReturnStatement(code, node, needSemicolon)
            break
        }
        case "StatementExpression": {
            formatExpressionStatement(code, node, needSemicolon)
            break
        }
        case "StatementAssign": {
            formatAssignStatement(code, node, needSemicolon)
            break
        }
        case "StatementCondition": {
            formatConditionStatement(code, node)
            break
        }
        case "StatementWhile": {
            formatWhileStatement(code, node)
            break
        }
        case "StatementRepeat": {
            formatRepeatStatement(code, node)
            break
        }
        case "StatementUntil": {
            formatUntilStatement(code, node, needSemicolon)
            break
        }
        case "StatementTry": {
            formatTryStatement(code, node)
            break
        }
        case "StatementForEach": {
            formatForEachStatement(code, node)
            break
        }
        case "StatementBlock": {
            const body = childByField(node, "body")
            if (body) {
                formatStatements(code, body)
            }
            break
        }
        default: {
            throw new Error(`Unsupported statement type: ${node.type}`)
        }
    }
}

const formatLetStatement = (code: CodeBuilder, node: CstNode, needSemicolon: boolean): void => {
    // let name : Int = 100;
    //     ^^^^ ^^^^^ ^ ^^^
    //     |    |     | |
    //     |    |     | init
    //     |    |     assign
    //     |    typeOpt
    //     name
    const name = childByField(node, "name")
    const typeOpt = childByField(node, "type")
    const init = childByField(node, "init")
    const assign = childLeafWithText(node, "=")

    if (!name || !init || !assign) {
        throw new Error("Invalid let statement")
    }

    code.add("let").space().apply(formatId, name)

    if (typeOpt) {
        formatInlineComments(node, code, name, typeOpt)
        formatAscription(code, typeOpt)
        formatInlineComments(node, code, typeOpt, assign)
    } else {
        formatInlineComments(node, code, name, assign)
    }

    code.space().add("=").space()

    const comments = getCommentsBetween(node, assign, init)
    if (comments.length > 0) {
        code.newLine()
        code.indent()
        for (const comment of comments) {
            code.add(visit(comment))
        }
        code.newLine()
        code.dedent()
    }

    formatExpression(code, init)

    if (needSemicolon) {
        code.add(";")
    }

    const endIndex = childIdxByField(node, "init")
    formatTrailingComments(code, node, endIndex)
}

const formatReturnStatement = (code: CodeBuilder, node: CstNode, needSemicolon: boolean): void => {
    // return 100;
    // ^^^^^^ ^^^
    // |      |
    // |      exprOpt
    // |
    // returnKeyword
    const returnKeyword = childLeafWithText(node, "return")
    if (!returnKeyword) {
        throw new Error("Invalid return statement")
    }
    const exprOpt = childByField(node, "expression")

    code.add("return")
    if (exprOpt) {
        code.space()
        formatInlineComments(node, code, returnKeyword, exprOpt)
        formatExpression(code, exprOpt)
    }
    if (needSemicolon) {
        code.add(";")
    }

    const endIndex = exprOpt ? childIdxByField(node, "expression") : 0 // index of return
    formatTrailingComments(code, node, endIndex)
}

const formatExpressionStatement = (
    code: CodeBuilder,
    node: CstNode,
    needSemicolon: boolean,
): void => {
    const expression = childByField(node, "expression")
    if (!expression) {
        throw new Error("Invalid expression statement")
    }
    formatExpression(code, expression)
    if (needSemicolon) {
        code.add(";")
    }

    const endIndex = childIdxByField(node, "expression")
    formatTrailingComments(code, node, endIndex)
}

const formatAssignStatement = (code: CodeBuilder, node: CstNode, needSemicolon: boolean): void => {
    // value + = 100;
    // ^^^^^ ^ ^ ^^^
    // |     | | |
    // |     | | right
    // |     | assign
    // |     operatorOpt
    // left
    const left = childByField(node, "left")
    const operatorOpt = childByField(node, "operator")
    const assign = childLeafWithText(node, "=")
    const right = childByField(node, "right")

    if (!left || !right || !assign) {
        throw new Error("Invalid assign statement")
    }

    formatExpression(code, left)

    code.space()
    if (operatorOpt) {
        code.add(visit(operatorOpt))
    }

    code.add("=").space()
    formatInlineComments(node, code, assign, right)

    formatExpression(code, right)
    if (needSemicolon) {
        code.add(";")
    }

    const endIndex = childIdxByField(node, "right")
    formatTrailingComments(code, node, endIndex)
}

const formatConditionStatement = (code: CodeBuilder, node: CstNode): void => {
    // if (true) {} else {}
    const ifKeyword = childLeafWithText(node, "if")
    const condition = childByField(node, "condition")
    const trueBranch = childByField(node, "trueBranch")
    const falseBranch = childByField(node, "falseBranch")

    if (!condition || !trueBranch || !ifKeyword) {
        throw new Error("Invalid condition statement")
    }

    code.add("if").space()
    formatInlineComments(node, code, ifKeyword, condition)

    formatExpression(code, condition)
    code.space()

    formatStatements(code, trueBranch)

    if (falseBranch) {
        if (singleLineStatement(trueBranch)) {
            // add a new line to format like this:
            // if (true) { return 10 }
            // else { return 20 }
            code.newLine()
        } else {
            code.space()
        }

        code.add("else").space()

        const branch = nonLeafChild(falseBranch)
        if (!branch) return

        if (branch.type === "StatementCondition") {
            formatConditionStatement(code, branch)
        } else {
            const body = childByField(branch, "body")
            if (body) {
                formatStatements(code, body)
            }
        }
    }

    const endIndex = childIdxByField(node, falseBranch ? "falseBranch" : "trueBranch")
    formatTrailingComments(code, node, endIndex)
}

const formatWhileStatement = (code: CodeBuilder, node: CstNode): void => {
    // while (true) {}
    //        ^^^^  ^^
    //        |     |
    //        |     body
    //        condition
    const condition = childByField(node, "condition")
    const body = childByField(node, "body")

    if (!condition || !body) {
        throw new Error("Invalid while statement")
    }

    code.add("while").space()
    formatExpression(code, condition)
    code.space()
    formatStatements(code, body)

    const endIndex = childIdxByField(node, "body")
    formatTrailingComments(code, node, endIndex)
}

const formatDestructField = (code: CodeBuilder, field: Cst): void => {
    if (field.$ !== "node") return

    if (field.type === "RegularField") {
        // foo: bar
        // ^^^  ^^^
        // |    |
        // |    fieldName
        // varName
        const fieldName = childByField(field, "fieldName")
        const varName = childByField(field, "varName")
        if (!fieldName || !varName) {
            throw new Error("Invalid regular field in destruct")
        }

        code.apply(formatId, fieldName).add(":").space().apply(formatId, varName)
    } else if (field.type === "PunnedField") {
        // foo
        // ^^^ this
        const name = childByField(field, "name")
        if (!name) {
            throw new Error("Invalid punned field in destruct")
        }
        code.apply(formatId, name)
    }
}

const formatDestructStatement = (
    code: CodeBuilder,
    node: CstNode,
    needSemicolon: boolean,
): void => {
    // let Foo { arg, foo: param, .. } = foo();
    //     ^^^   ^^^^^^^^^^^^^^^  ^^   ^ ^^^^^
    //     |     |                |    | |
    //     |     |                |    | init
    //     |     |                |    assign
    //     |     |                restOpt
    //     |     fields
    //     type
    const type = childByField(node, "type")
    const fields = childByField(node, "fields")
    const restOpt = childByType(node, "RestArgument")
    const assign = childLeafWithText(node, "=")
    const init = childByField(node, "init")

    if (!type || !fields || !assign || !init) {
        throw new Error("Invalid destruct statement")
    }

    code.add("let").space()
    formatType(code, type)

    code.space()

    const restArg =
        restOpt && restOpt.$ === "node" && restOpt.type === "RestArgument" ? ".." : undefined

    formatSeparatedList(code, fields, formatDestructField, {
        wrapperLeft: "{",
        wrapperRight: "}",
        extraWrapperSpace: " ",
        startIndex: 0,
        endIndex: 0,
        suffixElement: restArg,
        needSeparatorAfterSuffixElement: false, // comma is forbidden after `..`
    })

    code.space().add("=").space()
    formatExpression(code, init)
    if (needSemicolon) {
        code.add(";")
    }

    const endIndex = childIdxByField(node, "init")
    formatTrailingComments(code, node, endIndex)
}

const formatRepeatStatement = (code: CodeBuilder, node: CstNode): void => {
    // repeat(true) {}
    //        ^^^^  ^^
    //        |     |
    //        |     body
    //        condition
    const condition = childByField(node, "condition")
    const body = childByField(node, "body")

    if (!condition || !body) {
        throw new Error("Invalid repeat statement")
    }

    code.add("repeat").space()
    formatExpression(code, condition)
    code.space()
    formatStatements(code, body)

    const endIndex = childIdxByField(node, "body")
    formatTrailingComments(code, node, endIndex)
}

const formatUntilStatement = (code: CodeBuilder, node: CstNode, needSemicolon: boolean): void => {
    // do {} until (true);
    //    ^^       ^^^^^^
    //    |        |
    //    |        conditionNode
    //    body
    const body = childByField(node, "body")
    const conditionNode = childByField(node, "condition")
    const condition = nonLeafChild(conditionNode)

    if (!body || !conditionNode || !condition) {
        throw new Error("Invalid until statement")
    }

    code.add("do").space()
    formatStatements(code, body)
    code.space().add("until (")
    formatExpression(code, condition)
    code.add(")")
    if (needSemicolon) {
        code.add(";")
    }

    const endIndex = childIdxByField(node, "condition")
    formatTrailingComments(code, node, endIndex)
}

const formatTryStatement = (code: CodeBuilder, node: CstNode): void => {
    // try {} catch (e) {}
    //     ^^ ^^^^^^^^^^^^
    //     |  |
    //     |  handlerOpt
    //     body
    const body = childByField(node, "body")
    const handlerOpt = childByField(node, "handler")

    if (!body) {
        throw new Error("Invalid try statement")
    }

    code.add("try").space()
    formatStatements(code, body)

    if (handlerOpt) {
        // catch (e) {}
        //        ^  ^^
        //        |  |
        //        |  handlerBody
        //        name
        const name = childByField(handlerOpt, "name")
        const handlerBody = childByField(handlerOpt, "body")

        if (!name || !handlerBody) {
            throw new Error("Invalid catch handler")
        }

        code.space().add("catch").space().add("(").apply(formatId, name).add(")").space()
        formatStatements(code, handlerBody)
    }

    const endIndex = childIdxByField(node, handlerOpt ? "handler" : "body")
    formatTrailingComments(code, node, endIndex)
}

const formatForEachStatement = (code: CodeBuilder, node: CstNode): void => {
    // foreach (key, value in foo()) {}
    //          ^^^  ^^^^^    ^^^^^  ^^
    //          |    |        |      |
    //          |    |        |      body
    //          |    |        expression
    //          |    value
    //          key
    const key = childByField(node, "key")
    const value = childByField(node, "value")
    const expression = childByField(node, "expression")
    const body = childByField(node, "body")

    if (!key || !value || !expression || !body) {
        throw new Error("Invalid forEach statement")
    }

    code.add("foreach").space().add("(")
    code.apply(formatId, key).add(",").space().apply(formatId, value).space().add("in").space()
    formatExpression(code, expression)
    code.add(")").space()
    formatStatements(code, body)

    const endIndex = childIdxByField(node, "body")
    formatTrailingComments(code, node, endIndex)
}
