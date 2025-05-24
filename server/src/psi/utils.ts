import type {Node as SyntaxNode} from "web-tree-sitter"
import {index} from "@server/indexes"
import {NamedNode} from "@server/psi/Node"

export function parentOfType(node: SyntaxNode, ...types: readonly string[]): SyntaxNode | null {
    let parent = node.parent

    for (let i = 0; i < 100; i++) {
        if (parent === null) return null
        if (types.includes(parent.type)) return parent
        parent = parent.parent
    }

    return null
}

export function isFunNode(node: SyntaxNode): boolean {
    return (
        isNamedFunNode(node) ||
        node.type === "receive_function" ||
        node.type === "bounced_function" ||
        node.type === "external_function" ||
        node.type === "init_function"
    )
}

export function isNamedFunNode(node: SyntaxNode): boolean {
    return (
        node.type === "global_function" ||
        node.type === "asm_function" ||
        node.type === "native_function" ||
        node.type === "storage_function"
    )
}

export function isDocCommentOwner(node: SyntaxNode): boolean {
    return (
        node.type === "primitive" ||
        node.type === "global_constant" ||
        node.type === "native_function" ||
        node.type === "asm_function" ||
        node.type === "global_function" ||
        node.type === "struct" ||
        node.type === "message" ||
        node.type === "contract" ||
        node.type === "trait" ||
        node.type === "trait" ||
        node.type === "init_function" ||
        node.type === "receive_function" ||
        node.type === "bounced_function" ||
        node.type === "external_function" ||
        node.type === "storage_variable" ||
        node.type === "storage_constant"
    )
}

export function funNodesTypes(): string[] {
    return ["global_function", "asm_function", "native_function", "storage_function"]
}

export function isTypeOwnerNode(node: SyntaxNode): boolean {
    return (
        node.type === "field" ||
        node.type === "storage_variable" ||
        node.type === "parameter" ||
        node.type === "global_constant" ||
        node.type === "storage_constant"
    )
}

export function isDeprecated(symbol: NamedNode): boolean {
    const fileIndex = index.findFile(symbol.file.uri)
    if (!fileIndex) return false
    return fileIndex.isDeprecated(symbol.name())
}

export function measureTime<T>(label: string, fn: () => T): T {
    const startTime = performance.now()
    const result = fn()
    const endTime = performance.now()
    const time = endTime - startTime
    if (time > 0.3) {
        console.info(`${label}: ${time}ms`)
    }
    return result
}
