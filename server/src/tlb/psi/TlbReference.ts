import type {Node} from "web-tree-sitter"
import {File} from "@server/psi/File"
import {RecursiveVisitor} from "@server/psi/RecursiveVisitor"

export class TlbReference {
    private readonly element: Node
    private readonly file: File

    public static resolve(node: Node | null, file: File): Node | null {
        if (node === null) return null
        return new TlbReference(node, file).resolve()
    }

    public constructor(element: Node, file: File) {
        this.element = element
        this.file = file
    }

    public resolve(): Node | null {
        const result: Node[] = []
        this.processResolveVariants(result)
        if (result.length === 0) return null
        return result[0]
    }

    private processResolveVariants(result: Node[]): boolean {
        const name = this.element.text

        RecursiveVisitor.visit(this.file.rootNode, (node): boolean => {
            if (node.type !== "combinator") return true

            const identifier = node.firstNamedChild
            if (!identifier || identifier.type !== "type_identifier") return true

            if (identifier.text === name) {
                result.push(node)
                return false
            }

            return true
        })

        return true
    }
}
