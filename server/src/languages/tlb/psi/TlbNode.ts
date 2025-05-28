import type {Node as SyntaxNode} from "web-tree-sitter"
import {TlbFile} from "@server/languages/tlb/psi/TlbFile"
import {BaseNode} from "@server/psi/BaseNode"

export class TlbNode extends BaseNode {
    public readonly node: SyntaxNode
    public readonly file: TlbFile

    public constructor(node: SyntaxNode, file: TlbFile) {
        super()
        this.node = node
        this.file = file
    }
}
