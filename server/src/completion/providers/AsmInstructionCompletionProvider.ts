import * as fs from "fs"
import * as path from "path"
import {CompletionProvider} from "../CompletionProvider"
import {CompletionItem, CompletionItemKind} from "vscode-languageserver-types"
import {CompletionContext} from "../CompletionContext"
import {AsmData} from "../data/types"

export class AsmInstructionCompletionProvider implements CompletionProvider {
    private static data: AsmData | null = null

    private loadData(): AsmData {
        if (AsmInstructionCompletionProvider.data !== null) {
            return AsmInstructionCompletionProvider.data
        }

        const filePath = path.join(__dirname, "asm.json")
        const content = fs.readFileSync(filePath, "utf-8")
        AsmInstructionCompletionProvider.data = JSON.parse(content) as AsmData
        return AsmInstructionCompletionProvider.data
    }

    isAvailable(ctx: CompletionContext): boolean {
        return ctx.element.node.parent?.type === "tvm_ordinary_word"
    }

    addCompletion(_ctx: CompletionContext, elements: CompletionItem[]): void {
        const data = this.loadData()

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
