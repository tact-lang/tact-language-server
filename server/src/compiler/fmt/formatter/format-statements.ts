import {CstLeaf, CstNode} from "../cst/cst-parser"
import {
    childByField,
    childByType,
    childIdxByField,
    childLeafIdxWithText,
    childLeafWithText,
    nonLeafChild,
    trailingNewlines,
    visit,
} from "../cst/cst-helpers"
import {formatExpression} from "./format-expressions"
import {formatAscription, formatType} from "./format-types"
import {
    containsSeveralNewlines,
    formatId,
    formatSeparatedList,
    getLeafsBetween,
    multilineComments,
} from "./helpers"
import {formatTrailingComments, formatInlineComments} from "./format-comments"
import {FormatRule, FormatStatementRule} from "@server/compiler/fmt/formatter/formatter"
import {CodeBuilder} from "@server/compiler/fmt/formatter/code-builder"

export const formatStatements: FormatRule = (code, node) => {
    const endIndex = childLeafIdxWithText(node, "}")
    const statements = node.children.slice(0, endIndex).filter(it => it.$ === "node")
    if (statements.length === 0) {
        code.add("{}")
        formatTrailingComments(code, node, endIndex, true)
        return
    }

    if (isSingleLineStatement(node)) {
        code.add("{").space()
        formatStatement(code, statements[0], false)
        code.space().add("}")
        return
    }

    // don't add newline, see further comment
    code.add("{")

    // Block may have leading header comments after `{`:
    // ```
    // { // comment
    //   ^^^^^^^^^^ this
    //     let a = 100;
    // }
    // ```
    //
    // This flag tracks when we found the first new line,
    // in which case all further comments are NOT the leading heading
    let seenFirstNewline = false

    let needNewLine = false

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
            if (newlines > 1) {
                needNewLine = true
            }
        }

        code.newLine()
    }

    code.dedent().add("}")

    formatTrailingComments(code, node, endIndex, true)
}

export const formatStatement: FormatStatementRule = (code, node, needSemicolon) => {
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

function formatCommentsBetweenAssignAndValue(
    code: CodeBuilder,
    node: CstNode,
    assign: CstLeaf,
    init: CstNode,
): void {
    const commentsAndNewlines = getLeafsBetween(node, assign, init)
    const comments = commentsAndNewlines.filter(it => it.$ === "node" && it.type === "Comment")
    if (comments.length > 0) {
        const multiline = multilineComments(commentsAndNewlines)

        if (multiline) {
            code.indent()
            code.newLine()
        } else {
            code.space()
        }

        for (const comment of commentsAndNewlines) {
            if (comment.$ !== "node" || comment.type !== "Comment") continue
            code.add(visit(comment))
        }

        if (multiline) {
            code.newLine()
            code.dedent()
        } else {
            code.space()
        }
    } else {
        code.space()
    }
}

export const formatLetStatement: FormatStatementRule = (code, node, needSemicolon) => {
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
        formatInlineComments(node, code, name, typeOpt, true)
        formatAscription(code, typeOpt)
        formatInlineComments(node, code, typeOpt, assign, true)
    } else {
        formatInlineComments(node, code, name, assign, true)
    }

    code.space().add("=")

    formatCommentsBetweenAssignAndValue(code, node, assign, init)

    formatExpression(code, init)

    if (needSemicolon) {
        code.add(";")
    }

    const endIndex = childIdxByField(node, "init")
    formatTrailingComments(code, node, endIndex, true)
}

export const formatReturnStatement: FormatStatementRule = (code, node, needSemicolon) => {
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
        formatInlineComments(node, code, returnKeyword, exprOpt, true)
        formatExpression(code, exprOpt)
    }
    if (needSemicolon) {
        code.add(";")
    }

    const endIndex = exprOpt ? childIdxByField(node, "expression") : 0 // index of return
    formatTrailingComments(code, node, endIndex, true)
}

export const formatExpressionStatement: FormatStatementRule = (code, node, needSemicolon) => {
    const expression = childByField(node, "expression")
    if (!expression) {
        throw new Error("Invalid expression statement")
    }
    formatExpression(code, expression)
    if (needSemicolon) {
        code.add(";")
    }

    const endIndex = childIdxByField(node, "expression")
    formatTrailingComments(code, node, endIndex, true)
}

export const formatAssignStatement: FormatStatementRule = (code, node, needSemicolon) => {
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

    code.add("=")
    formatCommentsBetweenAssignAndValue(code, node, assign, right)

    formatExpression(code, right)
    if (needSemicolon) {
        code.add(";")
    }

    const endIndex = childIdxByField(node, "right")
    formatTrailingComments(code, node, endIndex, true)
}

export const formatConditionStatement: FormatRule = (code, node) => {
    // if (true) {} else {}
    const ifKeyword = childLeafWithText(node, "if")
    const condition = childByField(node, "condition")
    const trueBranch = childByField(node, "trueBranch")
    const falseBranch = childByField(node, "falseBranch")

    if (!condition || !trueBranch || !ifKeyword) {
        throw new Error("Invalid condition statement")
    }

    code.add("if").space()
    formatInlineComments(node, code, ifKeyword, condition, false)

    formatExpression(code, condition)
    code.space()

    formatStatements(code, trueBranch)

    if (falseBranch) {
        if (isSingleLineStatement(trueBranch)) {
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
    formatTrailingComments(code, node, endIndex, true)
}

export const formatWhileStatement: FormatRule = (code, node) => {
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
    formatTrailingComments(code, node, endIndex, true)
}

export const formatDestructField: FormatRule = (code, field) => {
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

export const formatDestructStatement: FormatStatementRule = (code, node, needSemicolon) => {
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

    const restArg = restOpt?.type === "RestArgument" ? ".." : undefined

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
    formatTrailingComments(code, node, endIndex, true)
}

export const formatRepeatStatement: FormatRule = (code, node) => {
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
    formatTrailingComments(code, node, endIndex, true)
}

export const formatUntilStatement: FormatStatementRule = (code, node, needSemicolon) => {
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
    formatTrailingComments(code, node, endIndex, true)
}

export const formatTryStatement: FormatRule = (code, node) => {
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
    formatTrailingComments(code, node, endIndex, true)
}

export const formatForEachStatement: FormatRule = (code, node) => {
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
    formatTrailingComments(code, node, endIndex, true)
}

function isSemicolonStatement(node: CstNode): boolean {
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

function isSingleLineStatement(node: CstNode): boolean {
    const endIndex = childLeafIdxWithText(node, "}")
    const statements = node.children.slice(0, endIndex).filter(it => it.$ === "node")
    if (statements.length === 0) {
        return false
    }

    const comments = statements.filter(it => it.type === "Comment")
    return (
        statements.length === 1 &&
        childLeafWithText(statements[0], ";") === undefined &&
        isSemicolonStatement(statements[0]) &&
        canBeSingleLine(statements[0]) &&
        comments.length === 0
    )
}
