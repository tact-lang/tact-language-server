import {CompletionProvider} from "@server/completion/CompletionProvider"
import {CompletionItem, CompletionItemKind, InsertTextFormat} from "vscode-languageserver-types"
import {CompletionContext} from "@server/completion/CompletionContext"

export class MessageMethodCompletionProvider implements CompletionProvider {
    isAvailable(ctx: CompletionContext): boolean {
        return ctx.topLevelInTraitOrContract
    }

    addCompletion(_ctx: CompletionContext, elements: CompletionItem[]): void {
        elements.push({
            label: "receive",
            labelDetails: {
                detail: "(msg: <type>) {}",
            },
            kind: CompletionItemKind.Keyword,
            insertText: "receive(msg: $1) {$0}",
            insertTextFormat: InsertTextFormat.Snippet,
        })

        elements.push({
            label: "receive",
            labelDetails: {
                detail: `("<message>") {}`,
            },
            kind: CompletionItemKind.Keyword,
            insertText: 'receive("$1") {$0}',
            insertTextFormat: InsertTextFormat.Snippet,
        })

        elements.push({
            label: "bounced",
            labelDetails: {
                detail: "(msg: <type>) {}",
            },
            kind: CompletionItemKind.Keyword,
            insertText: "bounced(msg: $1) {$0}",
            insertTextFormat: InsertTextFormat.Snippet,
        })

        elements.push({
            label: "init",
            labelDetails: {
                detail: "() {}",
            },
            kind: CompletionItemKind.Keyword,
            insertText: "init($1) {$0}",
            insertTextFormat: InsertTextFormat.Snippet,
        })
    }
}
