import {CompletionProvider} from "@server/completion/CompletionProvider"
import {CompletionItem, CompletionItemKind} from "vscode-languageserver-types"
import {CompletionContext} from "@server/completion/CompletionContext"
import {asmData} from "@server/completion/data/types"

export class AsmInstructionCompletionProvider implements CompletionProvider {
    isAvailable(ctx: CompletionContext): boolean {
        return ctx.element.node.parent?.type === "tvm_ordinary_word"
    }

    addCompletion(_ctx: CompletionContext, elements: CompletionItem[]): void {
        const data = asmData()

        for (const instruction of data.instructions) {
            elements.push({
                label: instruction.mnemonic,
                kind: CompletionItemKind.Function,
                labelDetails: {
                    detail: " " + instruction.doc.stack,
                    description: ` ${instruction.doc.gas}`,
                },
                detail: instruction.doc.stack,
            })
        }

        for (const alias of data.aliases) {
            elements.push({
                label: alias.mnemonic,
                kind: CompletionItemKind.Function,
                detail: alias.doc_stack ?? `Alias of ${alias.alias_of}`,
            })
        }
    }
}
