import {CompletionProvider} from "@server/completion/CompletionProvider"
import {CompletionItemKind} from "vscode-languageserver-types"
import {CompletionContext} from "@server/completion/CompletionContext"
import {asmData} from "@server/completion/data/types"
import {CompletionResult, CompletionWeight} from "@server/completion/WeightedCompletionItem"

export class AsmInstructionCompletionProvider implements CompletionProvider {
    isAvailable(ctx: CompletionContext): boolean {
        return ctx.element.node.parent?.type === "tvm_ordinary_word"
    }

    addCompletion(_ctx: CompletionContext, result: CompletionResult): void {
        const data = asmData()

        for (const instruction of data.instructions) {
            result.add({
                label: instruction.mnemonic,
                kind: CompletionItemKind.Function,
                labelDetails: {
                    detail: " " + instruction.doc.stack,
                    description: ` ${instruction.doc.gas}`,
                },
                detail: instruction.doc.stack,
                weight: CompletionWeight.CONTEXT_ELEMENT,
            })
        }

        for (const alias of data.aliases) {
            result.add({
                label: alias.mnemonic,
                kind: CompletionItemKind.Function,
                detail: alias.doc_stack ?? `Alias of ${alias.alias_of}`,
                weight: CompletionWeight.CONTEXT_ELEMENT,
            })
        }
    }
}
