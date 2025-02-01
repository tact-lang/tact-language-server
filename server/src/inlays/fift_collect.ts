import {InlayHint} from "vscode-languageserver"
import {File} from "@server/psi/File"
import {RecursiveVisitor} from "@server/visitor"
import {findInstruction} from "@server/completion/data/types"
import {InlayHintKind} from "vscode-languageserver-types"

export function collectFiftInlays(file: File): InlayHint[] {
    const result: InlayHint[] = []

    RecursiveVisitor.visit(file.rootNode, (n): boolean => {
        if (n.type === "identifier") {
            const instruction = findInstruction(n.text)
            if (instruction) {
                result.push({
                    kind: InlayHintKind.Type,
                    label: instruction.doc.gas,
                    position: {
                        line: n.endPosition.row,
                        character: n.endPosition.column,
                    },
                })
            }
        }
        return true
    })

    return result
}
