import {CodeBuilder} from "./code-builder"
import {Cst, CstNode} from "../cst/cst-parser"
import {visit} from "../cst/cst-helpers"
import {getCommentsBetween} from "./helpers"
import {FormatRule} from "@server/compiler/fmt/formatter/formatter"

export function formatTrailingComments(
    code: CodeBuilder,
    node: undefined | CstNode,
    startFrom: number,
): void {
    if (!node || startFrom < 0) return

    const afterBody = node.children.slice(startFrom + 1)
    if (afterBody.length === 0) return

    const comments = afterBody.filter(it => it.$ === "node" && it.type === "Comment")
    formatComments(code, comments)
}

export function formatInlineComments(node: CstNode, code: CodeBuilder, start: Cst, end: Cst): void {
    const comments = getCommentsBetween(node, start, end)
    formatComments(code, comments)
}

export function formatComments(code: CodeBuilder, comments: Cst[]): void {
    if (comments.length === 0) return

    code.space()
    for (const comment of comments) {
        code.add(visit(comment))
    }
}

export const formatComment: FormatRule = (code, comment) => {
    code.add(visit(comment).trim())
}
