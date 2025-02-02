import {CompletionProvider} from "@server/completion/CompletionProvider"
import {CompletionItemKind} from "vscode-languageserver-types"
import {CompletionContext} from "@server/completion/CompletionContext"
import {CompletionResult, CompletionWeight} from "@server/completion/WeightedCompletionItem"

export class KeywordsCompletionProvider implements CompletionProvider {
    isAvailable(ctx: CompletionContext): boolean {
        return ctx.expression() && !ctx.inNameOfFieldInit
    }

    addCompletion(_ctx: CompletionContext, result: CompletionResult): void {
        result.add({
            label: "true",
            kind: CompletionItemKind.Keyword,
            weight: CompletionWeight.KEYWORD,
        })

        result.add({
            label: "false",
            kind: CompletionItemKind.Keyword,
            weight: CompletionWeight.KEYWORD,
        })

        result.add({
            label: "null",
            kind: CompletionItemKind.Keyword,
            weight: CompletionWeight.KEYWORD,
        })
    }
}
