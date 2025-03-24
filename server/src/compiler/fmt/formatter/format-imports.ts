import {childByField, childLeafIdxWithText, visit} from "../cst/cst-helpers"
import {CstNode} from "../cst/cst-parser"
import {CodeBuilder} from "./code-builder"
import {formatExpression} from "./format-expressions"
import {formatDocComments} from "./format-doc-comments"
import {formatTrailingComments} from "./format-comments"

export function formatImport(code: CodeBuilder, node: CstNode): void {
    formatDocComments(code, node)

    const path = childByField(node, "path")
    if (!path) {
        throw new Error("Invalid import node structure")
    }
    const value = childByField(path, "value")
    if (!value) {
        throw new Error("Invalid import node structure")
    }

    code.add("import")
    code.space()
    formatExpression(code, path)
    code.add(";")

    // process trailing comments after `;`
    const semicolonIndex = childLeafIdxWithText(node, ";")
    formatTrailingComments(code, node, semicolonIndex)
}
