import type {Node as SyntaxNode} from "web-tree-sitter"
import {FiftReference} from "@server/fift/psi/FiftReference"
import {generateAsmDoc} from "../../documentation/asm_documentation"
import type {File} from "@server/psi/File"
import {findInstruction} from "@server/completion/data/types"

const CODE_FENCE = "```"

export function generateFiftDocFor(node: SyntaxNode, file: File): string | null {
    const def = FiftReference.resolve(node, file)
    if (def) {
        return `${CODE_FENCE}fift\n${def.parent?.text}\n${CODE_FENCE}`
    }

    const instr = findInstruction(node.text, [])
    if (!instr) return null

    const doc = generateAsmDoc(instr)
    if (doc) {
        return doc
    }

    return null
}
