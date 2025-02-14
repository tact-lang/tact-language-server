import type {Node as SyntaxNode} from "web-tree-sitter"

export class RecursiveVisitor {
    public static visit(node: SyntaxNode | null, visitor: (node: SyntaxNode) => void): void {
        if (!node) return
        visitor(node)
        node.children.forEach(child => {
            this.visit(child, visitor)
        })
    }
}
