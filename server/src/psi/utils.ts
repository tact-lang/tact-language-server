import type {SyntaxNode} from "web-tree-sitter"

export function parentOfType(node: SyntaxNode, ...types: readonly string[]): SyntaxNode | null {
    let parent = node.parent

    while (true) {
        if (parent === null) return null
        if (types.includes(parent.type)) return parent
        parent = parent.parent
    }
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
