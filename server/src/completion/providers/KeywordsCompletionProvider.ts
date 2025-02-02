import {CompletionProvider} from "@server/completion/CompletionProvider"
import {CompletionItem, CompletionItemKind} from "vscode-languageserver-types"
import {CompletionContext} from "@server/completion/CompletionContext"

export class KeywordsCompletionProvider implements CompletionProvider {
    isAvailable(ctx: CompletionContext): boolean {
        return ctx.expression() && !ctx.inNameOfFieldInit
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

        elements.push({
            label: "null",
            kind: CompletionItemKind.Keyword,
        })
    }
}
