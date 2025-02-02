import {Node as SyntaxNode, TreeCursor} from "web-tree-sitter"

class TreeWalker {
    private alreadyVisitedChildren = false

    constructor(private cursor: TreeCursor) {}

    next(): SyntaxNode | null {
        if (!this.alreadyVisitedChildren) {
            if (this.cursor.gotoFirstChild()) {
                this.alreadyVisitedChildren = false
            } else if (this.cursor.gotoNextSibling()) {
                this.alreadyVisitedChildren = false
            } else {
                if (!this.cursor.gotoParent()) {
                    return null
                }
                this.alreadyVisitedChildren = true
                return this.next()
            }
        } else {
            if (this.cursor.gotoNextSibling()) {
                this.alreadyVisitedChildren = false
            } else {
                if (!this.cursor.gotoParent()) {
                    return null
                }
                this.alreadyVisitedChildren = true
                return this.next()
            }
        }

        return this.cursor.currentNode
    }

    skipChildren() {
        this.alreadyVisitedChildren = true
    }
}

export class RecursiveVisitor {
    static visit(node: SyntaxNode | null, cb: (n: SyntaxNode) => boolean): boolean {
        if (!node) return true

        const walker = new TreeWalker(node.walk())
        let current: SyntaxNode | null = node

        while (current) {
            if (!cb(current)) {
                walker.skipChildren()
            }
            current = walker.next()
        }

        return true
    }
}
