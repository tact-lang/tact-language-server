import type {CompletionProvider} from "@server/completion/CompletionProvider"
import {CompletionItemKind} from "vscode-languageserver-types"
import type {CompletionContext} from "@server/completion/CompletionContext"
import {CompletionResult, CompletionWeight} from "@server/completion/WeightedCompletionItem"

export class SelfCompletionProvider implements CompletionProvider {
    public isAvailable(ctx: CompletionContext): boolean {
        return ctx.expression() && ctx.insideTraitOrContract
    }

    public addCompletion(_ctx: CompletionContext, result: CompletionResult): void {
        result.add({
            label: "self",
            kind: CompletionItemKind.Keyword,
            weight: CompletionWeight.LOWEST,
        })
    }
}
