import {CstNode} from "../cst/cst-parser"
import {childByField, childrenByType, visit} from "../cst/cst-helpers"
import {CodeBuilder} from "./code-builder"

export const formatDocComments = (code: CodeBuilder, node: CstNode): void => {
    const docNode = childByField(node, "doc")
    if (!docNode) return

    const comments = childrenByType(docNode, "Comment")
    if (comments.length > 0) {
        for (const comment of comments) {
            code.add(visit(comment).trim())
            code.newLine()
        }
    }
}
