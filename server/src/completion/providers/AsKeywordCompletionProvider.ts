import {CompletionProvider} from "@server/completion/CompletionProvider"
import {CompletionItemKind, InsertTextFormat} from "vscode-languageserver-types"
import {CompletionContext} from "@server/completion/CompletionContext"
import {CompletionResult, CompletionWeight} from "@server/completion/WeightedCompletionItem"

export class AsKeywordCompletionProvider implements CompletionProvider {
    isAvailable(ctx: CompletionContext): boolean {
        return ctx.afterFieldType
    }

    addCompletion(_ctx: CompletionContext, result: CompletionResult): void {
        result.add({
            label: "as",
            labelDetails: {
                detail: " type",
            },
            kind: CompletionItemKind.Keyword,
            insertText: "as $0",
            insertTextFormat: InsertTextFormat.Snippet,
            weight: CompletionWeight.CONTEXT_ELEMENT,
        })
    }
}
