//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type {InlayHint} from "vscode-languageserver"
import type {File} from "@server/languages/tact/psi/File"
import {RecursiveVisitor} from "@server/languages/tact/psi/visitor"
import {findInstruction} from "@server/languages/tact/completion/data/types"
import {InlayHintKind} from "vscode-languageserver-types"
import {instructionPresentation} from "@server/languages/tact/asm/gas"

export function collectFift(
    file: File,
    gasFormat: string,
    settings: {
        showGasConsumption: boolean
    },
): InlayHint[] {
    const result: InlayHint[] = []

    RecursiveVisitor.visit(file.rootNode, (n): boolean => {
        if (n.type === "identifier" && settings.showGasConsumption) {
            const instruction = findInstruction(n.text)
            if (!instruction) return true

            const presentation = instructionPresentation(
                instruction.doc.gas,
                instruction.doc.stack,
                gasFormat,
            )

            result.push({
                kind: InlayHintKind.Type,
                label: presentation,
                position: {
                    line: n.endPosition.row,
                    character: n.endPosition.column,
                },
            })
        }
        return true
    })

    return result
}
