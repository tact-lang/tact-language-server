import type {Node} from "web-tree-sitter"
import {File} from "@server/psi/File"
import {RecursiveVisitor} from "@server/psi/RecursiveVisitor"

export class TlbReferent {
    private readonly resolved: Node | null = null
    private readonly file: File

    public constructor(node: Node, file: File) {
        this.file = file
        this.resolved = node
    }

    public findReferences(includeDefinition: boolean = false): Node[] {
        const resolved = this.resolved
        if (!resolved) return []

        const result: Node[] = []
        if (includeDefinition) {
            result.push(resolved)
        }

        this.searchInScope(result)
        return result
    }

    private searchInScope(result: Node[]): void {
        if (!this.resolved) return

        this.traverseTree(result)
    }

    private traverseTree(result: Node[]): void {
        const resolved = this.resolved
        if (!resolved) return

        const name = resolved.text
        if (!name) return

        RecursiveVisitor.visit(this.file.rootNode, (node): boolean => {
            if (node.type !== "identifier" && node.type !== "type_identifier") return true
            if (node.text !== name) return true

            const parent = node.parent
            if (!parent || parent.type === "combinator") return true

            result.push(node)
            return true
        })
    }
}
