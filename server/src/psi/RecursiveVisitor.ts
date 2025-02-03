import {Node as SyntaxNode} from "web-tree-sitter"

export class RecursiveVisitor {
    static visit(node: SyntaxNode | null, visitor: (node: SyntaxNode) => void) {
        if (!node) return
        visitor(node)
        node.children.forEach(child => {
            this.visit(child, visitor)
        })
    }
}
