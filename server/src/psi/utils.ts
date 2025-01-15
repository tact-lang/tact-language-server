import type {SyntaxNode} from "web-tree-sitter";

export function parentOfType(node: SyntaxNode, ...types: readonly string[]): SyntaxNode | null {
    let parent = node.parent

    while (true) {
        if (parent === null) return null
        if (types.includes(parent.type)) return parent
        parent = parent.parent
    }
}

export function isFunctionNode(node: SyntaxNode): boolean {
    return isNamedFunctionNode(node) ||
        node.type === 'receive_function' ||
        node.type === 'bounced_function' ||
        node.type === 'external_function' ||
        node.type === 'init_function'
}

export function isNamedFunctionNode(node: SyntaxNode): boolean {
    return node.type === 'global_function' || node.type === 'asm_function' || node.type === 'native_function'
}
