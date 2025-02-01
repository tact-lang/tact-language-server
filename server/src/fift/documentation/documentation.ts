import {Node as SyntaxNode} from "web-tree-sitter"
import {FiftReference} from "@server/fift/psi/FiftReference"
import {generateAsmDoc} from "../../documentation/asm_documentation"
import {File} from "@server/psi/File"

const CODE_FENCE = "```"

export function generateFiftDocFor(node: SyntaxNode, file: File): string | null {
    const def = FiftReference.resolve(node, file)
    if (def) {
        return `${CODE_FENCE}fift\n${def.parent?.text}\n${CODE_FENCE}`
    }

    const doc = generateAsmDoc(node.text)
    if (doc) {
        return doc
    }

    return null
}
