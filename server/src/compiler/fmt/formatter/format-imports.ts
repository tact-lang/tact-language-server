import {childByField, childLeafIdxWithText} from "../cst/cst-helpers"
import {formatExpression} from "./format-expressions"
import {formatDocComments} from "./format-doc-comments"
import {formatTrailingComments} from "./format-comments"
import {FormatRule} from "@server/compiler/fmt/formatter/formatter"

export const formatImport: FormatRule = (code, node) => {
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
