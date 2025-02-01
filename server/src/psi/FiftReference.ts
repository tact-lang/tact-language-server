import {Node as SyntaxNode} from "web-tree-sitter"
import {File} from "./File"
import {RecursiveVisitor} from "@server/visitor"

export class FiftReference {
    private readonly node: SyntaxNode
    private readonly file: File

    constructor(node: SyntaxNode, file: File) {
        this.node = node
        this.file = file
    }

    public resolve(): SyntaxNode | null {
        if (
            this.node.type !== "identifier" &&
            !(this.node.parent?.type === "proc_call" && this.node.parent?.firstChild === this.node)
        ) {
            return null
        }

        let definition: SyntaxNode | null = null
        const word = this.node.text

        RecursiveVisitor.visit(this.file.rootNode, (node): boolean => {
            if (
                node.type === "proc_definition" ||
                node.type === "proc_inline_definition" ||
                node.type === "proc_ref_definition" ||
                node.type === "method_definition"
            ) {
                const nameNode = node.childForFieldName("name")
                if (nameNode?.text === word) {
                    definition = nameNode
                    return false
                }
            }
            return true
        })

        return definition
    }

    public static resolve(node: SyntaxNode, file: File): SyntaxNode | null {
        return new FiftReference(node, file).resolve()
    }
}
