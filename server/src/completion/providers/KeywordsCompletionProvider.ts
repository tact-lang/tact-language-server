import {CompletionProvider} from "../CompletionProvider"
import {CompletionItem, CompletionItemKind} from "vscode-languageserver-types"
import {CompletionContext} from "../CompletionContext"

export class KeywordsCompletionProvider implements CompletionProvider {
    isAvailable(ctx: CompletionContext): boolean {
        return ctx.expression()
    }

    addCompletion(_ctx: CompletionContext, elements: CompletionItem[]): void {
        elements.push({
            label: "true",
            kind: CompletionItemKind.Keyword,
        })

        elements.push({
            label: "false",
            kind: CompletionItemKind.Keyword,
        })
    }
}
