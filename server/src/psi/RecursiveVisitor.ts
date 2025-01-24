import {SyntaxNode} from "web-tree-sitter"

export class RecursiveVisitor {
    static visit(node: SyntaxNode, visitor: (node: SyntaxNode) => void) {
        visitor(node)
        node.children.forEach(child => this.visit(child, visitor))
    }
}
