import {Node as SyntaxNode} from "web-tree-sitter"

export class RecursiveVisitor {
    static visit(node: SyntaxNode | null, cb: (n: SyntaxNode) => boolean): boolean {
        if (!node || !cb(node)) return false

        for (const child of node.children) {
            if (!this.visit(child, cb)) return false
        }

        return true
    }
}
