//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import {childByField, childrenByType, visit} from "../cst/cst-helpers"
import {FormatRule} from "@server/languages/tact/compiler/fmt/formatter/formatter"

export const formatDocComments: FormatRule = (code, node) => {
    const docNode = childByField(node, "doc")
    if (!docNode) return

    const comments = childrenByType(docNode, "Comment")
    if (comments.length === 0) return

    for (const comment of comments) {
        code.add(visit(comment).trim())
        code.newLine()
    }
}
