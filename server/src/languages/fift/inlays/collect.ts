//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type {InlayHint} from "vscode-languageserver"
import {AsyncRecursiveVisitor} from "@server/languages/tact/psi/visitor"
import {findInstruction} from "@server/languages/tact/completion/data/types"
import {InlayHintKind} from "vscode-languageserver-types"
import {instructionPresentation} from "@server/languages/tact/asm/gas"
import {FiftFile} from "@server/languages/fift/psi/FiftFile"

export async function provideFiftInlayHints(
    file: FiftFile,
    gasFormat: string,
    settings: {
        showGasConsumption: boolean
    },
): Promise<InlayHint[]> {
    const result: InlayHint[] = []

    await AsyncRecursiveVisitor.visit(file.rootNode, async (n): Promise<boolean> => {
        if (n.type === "identifier" && settings.showGasConsumption) {
            const instruction = await findInstruction(n.text)
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
