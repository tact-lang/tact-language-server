import {Builder, createContext, CstNode, Module, skip, space} from "./cst/cst-parser"
import {processDocComments} from "./cst/process-comments"
import {simplifyCst} from "./cst/simplify-cst"
import {format} from "./formatter/formatter"

export function formatCode(code: string): string {
    const ctx = createContext(code, space)
    const b: Builder = []
    skip(ctx, b)
    const isParsed = Module(ctx, b)
    if (!isParsed) {
        return code
    }

    const root = processDocComments(simplifyCst(CstNode(b, "Root")))
    return format(root)
}
