import {Cst, CstNode} from "../cst/cst-parser"
import {CodeBuilder} from "./code-builder"
import {childByField, visit} from "../cst/cst-helpers"
import {formatTrailingComments} from "./format-comments"

interface CommentWithNewline {
    node: CstNode
    hasNewline: boolean
}

interface ListInfo {
    items: ListItemInfo[]
    leadingComments: CommentWithNewline[]
    inlineLeadingComments: CommentWithNewline[]
    trailingComments: CommentWithNewline[]
    shouldBeMultiline: boolean
}

interface ListItemInfo {
    item: Cst
    leadingComments: CommentWithNewline[]
    trailingComments: CommentWithNewline[]
    hasLeadingNewline: boolean
    hasTrailingNewline: boolean
}

export function collectListInfo(node: CstNode, startIndex: number, endIndex: number): ListInfo {
    const result: ListItemInfo[] = []
    let currentItem: ListItemInfo | null = null
    let wasComma: boolean = false
    const listInlineLeadingComments: CommentWithNewline[] = []
    const listLeadingComments: CommentWithNewline[] = []
    let leadingComments: CommentWithNewline[] = []
    let inLeadingComments: boolean = true

    let shouldBeMultiline = false

    let i = startIndex
    let processList: readonly Cst[] = node.children.slice(
        0,
        endIndex === 0 ? node.children.length : endIndex,
    )

    let wasInitialNewline = false
    while (i < processList.length) {
        const child = processList[i]

        if (child.$ === "leaf") {
            if (child.text === ",") {
                wasComma = true
            } else if (child.text.includes("\n")) {
                if (currentItem && containsSeveralNewlines(child.text)) {
                    currentItem.hasTrailingNewline = true
                }

                if (leadingComments.length > 0) {
                    // eslint-disable-next-line unicorn/prefer-at
                    leadingComments[leadingComments.length - 1].hasNewline = true
                } else if (listLeadingComments.length > 0 && inLeadingComments) {
                    // eslint-disable-next-line unicorn/prefer-at
                    listLeadingComments[listLeadingComments.length - 1].hasNewline = true
                }

                if (currentItem && wasComma) {
                    result.push(currentItem)
                    currentItem = null
                    wasComma = false
                }
                shouldBeMultiline = true
                wasInitialNewline = true
            }
        } else if (child.type === "Comment") {
            const commentWithNewline: CommentWithNewline = {
                node: child,
                hasNewline: false,
            }
            if (currentItem) {
                currentItem.trailingComments.push(commentWithNewline)
            } else if (result.length === 0) {
                if (wasInitialNewline) {
                    listLeadingComments.push(commentWithNewline)
                } else {
                    listInlineLeadingComments.push(commentWithNewline)
                }
            } else {
                leadingComments.push(commentWithNewline)
            }
        } else {
            if (child.type === "tail" || child.type === "fields") {
                processList = child.children
                i = 0
                continue
            }

            if (currentItem) {
                result.push(currentItem)
                currentItem = null
                leadingComments = []
            }

            currentItem = {
                item: child,
                leadingComments: leadingComments,
                trailingComments: [],
                hasLeadingNewline:
                    leadingComments.some(c => c.hasNewline) ||
                    (result.length > 0 && (result.at(-1)?.hasTrailingNewline ?? false)),
                hasTrailingNewline: false,
            }
            leadingComments = []
            inLeadingComments = false
        }
        i++
    }

    if (currentItem) {
        result.push(currentItem)
    }

    return {
        items: result,
        shouldBeMultiline,
        leadingComments: listLeadingComments,
        inlineLeadingComments: listInlineLeadingComments,
        trailingComments: leadingComments,
    }
}

export const formatSeparatedList = (
    code: CodeBuilder,
    node: CstNode,
    formatItem: (code: CodeBuilder, item: CstNode) => void,
    options: {
        startIndex?: number
        endIndex?: number
        wrapperLeft?: string
        wrapperRight?: string
        extraWrapperSpace?: string
        suffixElement?: string
        needSeparatorAfterSuffixElement?: boolean
        separator?: string
        spaceBeforeIfNotMultiline?: boolean
        provideTrailingComments?: (item: Cst) => undefined | Cst[]
    } = {},
): void => {
    const {
        wrapperLeft = "(",
        wrapperRight = ")",
        separator = ",",
        startIndex = 1,
        endIndex = -1,
        extraWrapperSpace,
        suffixElement,
        spaceBeforeIfNotMultiline,
        needSeparatorAfterSuffixElement,
    } = options

    const info = collectListInfo(node, startIndex, endIndex)
    const items = info.items
    const shouldBeMultiline = info.shouldBeMultiline

    if (!shouldBeMultiline && spaceBeforeIfNotMultiline) {
        code.add(" ")
    }

    code.add(wrapperLeft)

    if (shouldBeMultiline) {
        if (info.inlineLeadingComments.length > 0) {
            code.space()
            info.inlineLeadingComments.forEach(comment => {
                code.add(visit(comment.node))
            })
        }

        code.newLine().indent()

        info.leadingComments.forEach(comment => {
            code.add(visit(comment.node))
            if (comment.hasNewline) {
                code.newLine()
            }
        })

        items.forEach(item => {
            item.leadingComments.forEach(comment => {
                code.add(visit(comment.node))
                if (comment.hasNewline) {
                    code.newLine()
                } else {
                    code.space()
                }
            })

            if (item.item.$ === "node") {
                formatItem(code, item.item)
            }
            code.add(separator)

            if (item.hasTrailingNewline) {
                code.newLine()
            }

            const trailingComments = [
                ...(options.provideTrailingComments?.(item.item) ?? []),
                ...item.trailingComments.map(it => it.node),
            ]
            trailingComments.forEach((comment, index) => {
                code.space().add(visit(comment))

                if (index !== trailingComments.length - 1) {
                    code.newLine()
                }
            })

            code.newLine()
        })

        if (suffixElement) {
            code.add(suffixElement)
            if (needSeparatorAfterSuffixElement) {
                code.add(separator)
            }
            code.newLine()
        }

        if (info.trailingComments.length > 0) {
            info.trailingComments.forEach((comment, index) => {
                code.add(visit(comment.node))
                if (comment.hasNewline || index === info.trailingComments.length - 1) {
                    code.newLine()
                }
            })
        }

        code.dedent().add(wrapperRight)
    } else {
        if (items.length > 0 && extraWrapperSpace) {
            code.add(extraWrapperSpace)
        }

        if (info.inlineLeadingComments.length > 0) {
            for (const comment of info.inlineLeadingComments) {
                code.add(visit(comment.node))
                code.space()
            }
        }

        info.leadingComments.forEach(comment => {
            code.add(visit(comment.node))

            if (comment.hasNewline) {
                code.newLine()
            } else {
                code.space()
            }
        })

        items.forEach((item, index) => {
            if (item.item.$ === "node") {
                formatItem(code, item.item)
            }
            if (index < items.length - 1) {
                code.add(separator).space()
            }
        })

        if (suffixElement) {
            code.add(separator).space().add(suffixElement)
        }

        if (items.length > 0 && extraWrapperSpace) {
            code.add(extraWrapperSpace)
        }

        code.add(wrapperRight)
    }
}

export const getCommentsBetween = (
    node: CstNode,
    startNode: undefined | Cst,
    endNode: undefined | Cst,
): CstNode[] => {
    const startIndex = startNode ? node.children.indexOf(startNode) : -1
    const endIndex = endNode ? node.children.indexOf(endNode) : node.children.length

    return node.children.filter((child, childIndex) => {
        if (child.$ !== "node" || child.type !== "Comment") return false
        return childIndex > startIndex && childIndex < endIndex
    }) as CstNode[]
}

export const getLeafsBetween = (
    node: CstNode,
    startNode: undefined | Cst,
    endNode: undefined | Cst,
): Cst[] => {
    const startIndex = startNode ? node.children.indexOf(startNode) : -1
    const endIndex = endNode ? node.children.indexOf(endNode) : node.children.length

    return node.children.filter((_, childIndex) => childIndex > startIndex && childIndex < endIndex)
}

// name: Id
//   name: name
//      "some"
export const idText = (node: Cst): string => {
    const name = childByField(node, "name")
    if (!name) return ""
    const child = name.children.at(0)
    if (!child) return ""
    return visit(child)
}

export const formatId = (code: CodeBuilder, node: Cst): void => {
    if (node.$ === "leaf") return

    const name = idText(node)
    code.add(name)

    formatTrailingComments(code, node, 1, true)
}

export function declName(node: CstNode): string {
    const name = childByField(node, "name")
    if (!name || (name.type !== "TypeId" && name.type !== "Id")) {
        throw new Error(`Invalid name`)
    }
    return idText(name)
}

export function containsSeveralNewlines(text: string): boolean {
    const index = text.indexOf("\n")
    if (index === -1) {
        return false
    }
    return text.slice(index + 1).includes("\n")
}

export function multilineComments(comments: Cst[]): boolean {
    return comments.some(it => {
        return visit(it).includes("\n")
    })
}
