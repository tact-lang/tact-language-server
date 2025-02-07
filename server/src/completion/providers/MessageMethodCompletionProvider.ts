import {CompletionProvider} from "@server/completion/CompletionProvider"
import {CompletionItemKind, InsertTextFormat} from "vscode-languageserver-types"
import {CompletionContext} from "@server/completion/CompletionContext"
import {CompletionResult, CompletionWeight} from "@server/completion/WeightedCompletionItem"

export class MessageMethodCompletionProvider implements CompletionProvider {
    isAvailable(ctx: CompletionContext): boolean {
        return ctx.topLevelInTraitOrContract
    }

    addCompletion(_ctx: CompletionContext, result: CompletionResult): void {
        result.add({
            label: "receive",
            labelDetails: {
                detail: "(msg: <type>) {}",
            },
            kind: CompletionItemKind.Keyword,
            insertText: "receive(msg: $1) {$0}",
            insertTextFormat: InsertTextFormat.Snippet,
            weight: CompletionWeight.KEYWORD,
        })

        result.add({
            label: "receive",
            labelDetails: {
                detail: `("<message>") {}`,
            },
            kind: CompletionItemKind.Keyword,
            insertText: 'receive("$1") {$0}',
            insertTextFormat: InsertTextFormat.Snippet,
            weight: CompletionWeight.KEYWORD,
        })

        result.add({
            label: "receive",
            labelDetails: {
                detail: `() {}`,
            },
            kind: CompletionItemKind.Keyword,
            insertText: "receive() {$0}",
            insertTextFormat: InsertTextFormat.Snippet,
            weight: CompletionWeight.KEYWORD,
        })

        result.add({
            label: "bounced",
            labelDetails: {
                detail: "(msg: <type>) {}",
            },
            kind: CompletionItemKind.Keyword,
            insertText: "bounced(msg: $1) {$0}",
            insertTextFormat: InsertTextFormat.Snippet,
            weight: CompletionWeight.KEYWORD,
        })

        result.add({
            label: "init",
            labelDetails: {
                detail: "() {}",
            },
            kind: CompletionItemKind.Keyword,
            insertText: "init($1) {$0}",
            insertTextFormat: InsertTextFormat.Snippet,
            weight: CompletionWeight.KEYWORD,
        })
    }
}
