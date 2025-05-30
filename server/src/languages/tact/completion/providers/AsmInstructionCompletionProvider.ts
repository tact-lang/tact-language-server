//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type {AsyncCompletionProvider} from "@server/languages/tact/completion/CompletionProvider"
import {CompletionItemKind} from "vscode-languageserver-types"
import type {CompletionContext} from "@server/languages/tact/completion/CompletionContext"
import {asmData, getStackPresentation} from "@server/languages/tact/completion/data/types"
import {
    CompletionResult,
    CompletionWeight,
} from "@server/languages/tact/completion/WeightedCompletionItem"

export class AsmInstructionCompletionProvider implements AsyncCompletionProvider {
    public isAvailable(ctx: CompletionContext): boolean {
        return ctx.element.node.type === "tvm_instruction"
    }

    public async addCompletion(_ctx: CompletionContext, result: CompletionResult): Promise<void> {
        const data = await asmData()

        for (const instruction of data.instructions) {
            const name = this.adjustName(instruction.mnemonic)
            const stack = getStackPresentation(instruction.doc.stack)

            result.add({
                label: name,
                kind: CompletionItemKind.Function,
                labelDetails: {
                    detail: " " + stack,
                    description: ` ${instruction.doc.gas}`,
                },
                detail: stack,
                weight: CompletionWeight.CONTEXT_ELEMENT,
            })
        }

        for (const alias of data.aliases) {
            const stack = alias.doc_stack ? getStackPresentation(alias.doc_stack) : undefined
            result.add({
                label: alias.mnemonic,
                kind: CompletionItemKind.Function,
                detail: stack ?? `Alias of ${alias.alias_of}`,
                weight: CompletionWeight.CONTEXT_ELEMENT,
            })
        }
    }

    private adjustName(name: string): string {
        if (name.startsWith("PUSHINT_")) return "PUSHINT"
        if (name === "XCHG_0I") return "XCHG0"
        if (name === "XCHG_IJ") return "XCHG"
        if (name === "XCHG_0I_LONG") return "XCHG"
        if (name === "XCHG_1I") return "XCHG"
        return name
    }
}
