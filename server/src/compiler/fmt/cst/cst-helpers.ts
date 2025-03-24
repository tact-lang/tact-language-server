import {Builder, createContext, Cst, CstLeaf, CstNode, Module, skip, space} from "./cst-parser"
import {processDocComments} from "./process-comments"
import {simplifyCst} from "./simplify-cst"

export function parseCode(code: string): undefined | Cst {
    const ctx = createContext(code, space)
    const b: Builder = []
    skip(ctx, b)
    const res = Module(ctx, b)
    if (!res) {
        return undefined
    }
    return processDocComments(simplifyCst(CstNode(b, "Root")))
}

export const visit = (node: Cst): string => {
    if (node.$ === "leaf") return node.text
    return node.children.map(it => visit(it)).join("")
}

export const childByType = (node: Cst, type: string): undefined | Cst => {
    if (node.$ === "leaf") {
        return undefined
    }

    return node.children.find(c => c.$ === "node" && c.type === type)
}

export const childIdxByType = (node: Cst, type: string): number => {
    if (node.$ === "leaf") {
        return -1
    }

    return node.children.findIndex(c => c.$ === "node" && c.type === type)
}

export const childrenByType = (node: Cst, type: string): Cst[] => {
    if (node.$ === "leaf") {
        return []
    }

    return node.children.filter(c => c.$ === "node" && c.type === type)
}

export const childrenByGroup = (node: Cst, group: string): Cst[] => {
    if (node.$ === "leaf") {
        return []
    }

    return node.children.filter(c => c.$ === "node" && c.group === group)
}

export const nonLeafChild = (node: undefined | Cst): undefined | CstNode => {
    if (!node || node.$ === "leaf") {
        return undefined
    }

    return node.children.find(c => c.$ === "node")
}

export const childByField = (node: Cst, field: string): undefined | CstNode => {
    if (node.$ === "leaf") {
        return undefined
    }

    const res = node.children.find(c => c.$ === "node" && c.field === field)
    if (res && res.$ === "node") {
        return res
    }
    return undefined
}

export const childIdxByField = (node: Cst, field: string): number => {
    if (node.$ === "leaf") {
        return -1
    }

    return node.children.findIndex(c => c.$ === "node" && c.field === field)
}

export const childLeafWithText = (node: undefined | Cst, text: string): undefined | CstLeaf => {
    if (!node || node.$ === "leaf") {
        return undefined
    }

    const res = node.children.find(c => c.$ === "leaf" && c.text === text)
    if (res && res.$ === "leaf") {
        return res
    }
    return undefined
}

export const childLeafIdxWithText = (node: undefined | Cst, text: string): number => {
    if (!node || node.$ === "leaf") {
        return -1
    }
    return node.children.findIndex(c => c.$ === "leaf" && c.text === text)
}

export const textOfId = (node: Cst): string => {
    if (node.$ === "leaf") return node.text
    if (node.type === "Id" || node.type === "TypeId") {
        const name = childByField(node, "name")
        if (!name) return ""
        const first = name.children.at(0)
        return first && first.$ === "leaf" ? first.text : ""
    }
    return ""
}

export const isLowerCase = (str: string): boolean => {
    return str === str.toLowerCase() && str !== str.toUpperCase()
}

export const visualizeCST = (node: Cst, field: undefined | string, indent: string = ""): string => {
    const fieldRepr = field ? `${field}: ` : ""
    if (node.$ === "leaf") {
        const text = node.text.replace(/\n/g, String.raw`\n`).slice(0, 30)
        return `${indent}${fieldRepr}"${text}${node.text.length > 30 ? "..." : ""}"`
    }

    let result = `${indent}${fieldRepr}${node.type}`

    if (node.children.length === 0) {
        return `${result} (empty)`
    }

    result += "\n"

    const childrenOutput = node.children
        .map(child =>
            visualizeCST(child, child.$ === "node" ? child.field : undefined, indent + "  "),
        )
        .join("\n")

    return result + childrenOutput
}

export function countNewlines(leaf: undefined | Cst): number {
    if (!leaf || leaf.$ !== "leaf") return 0
    // eslint-disable-next-line unicorn/prefer-spread
    return leaf.text.split("").filter(it => it === "\n").length
}

export function trailingNewlines(node: Cst): number {
    if (node.$ === "leaf") return 0

    if (node.children.length === 0) {
        return 0
    }

    const lastChild = node.children.at(-1)
    if (!lastChild) return 0

    if (lastChild.$ === "leaf") {
        if (lastChild.text.includes("\n")) {
            return countNewlines(lastChild)
        }
        return 0
    }

    return trailingNewlines(lastChild)
}
