//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type {Node as SyntaxNode} from "web-tree-sitter"

export class RecursiveVisitor {
    public static visit(node: SyntaxNode | null, visitor: (node: SyntaxNode) => void): void {
        if (!node) return
        visitor(node)
        for (const child of node.children) {
            this.visit(child, visitor)
        }
    }
}
