//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type {Node as SyntaxNode} from "web-tree-sitter"
import type {File} from "@server/languages/tact/psi/File"
import {RecursiveVisitor} from "@server/languages/tact/psi/visitor"
import {Node} from "@server/languages/tact/psi/Node"
import {FiftReference} from "./FiftReference"

export class FiftReferent {
    private readonly node: SyntaxNode
    private readonly file: File
    private readonly resolved: SyntaxNode | null = null

    public constructor(node: SyntaxNode, file: File) {
        this.node = node
        this.file = file
        this.resolved = FiftReference.resolve(node, file)
    }

    public findReferences(includeDefinition: boolean = false): Node[] {
        if (!this.resolved) return []

        const result: Node[] = []
        if (includeDefinition) {
            result.push(new Node(this.resolved, this.file))
        }

        const word = this.resolved.text

        RecursiveVisitor.visit(this.file.rootNode, (node): boolean => {
            if (node.type !== "identifier") return true
            if (node.text !== word) return true

            const parent = node.parent
            if (!parent) return true

            if (
                (parent.type === "proc_definition" ||
                    parent.type === "proc_inline_definition" ||
                    parent.type === "method_definition" ||
                    parent.type === "declaration") &&
                parent.childForFieldName("name")?.equals(node)
            ) {
                return true
            }

            const def = FiftReference.resolve(node, this.file)
            if (def?.equals(this.node)) {
                result.push(new Node(node, this.file))
            }

            return true
        })

        return result
    }
}
