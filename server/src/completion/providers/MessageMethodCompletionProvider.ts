import {CompletionProvider} from "../CompletionProvider"
import {CompletionItem, CompletionItemKind, InsertTextFormat} from "vscode-languageserver-types"
import {CompletionContext} from "../CompletionContext"

export class MessageMethodCompletionProvider implements CompletionProvider {
    isAvailable(ctx: CompletionContext): boolean {
        return ctx.topLevelInTraitOrContract
    }

    addCompletion(_ctx: CompletionContext, elements: CompletionItem[]): void {
        elements.push({
            label: "receive(msg: <type>) {}",
            kind: CompletionItemKind.Keyword,
            insertText: "receive(msg: $1) {$0}",
            insertTextFormat: InsertTextFormat.Snippet,
        })

        elements.push({
            label: 'receive("<message>") {}',
            kind: CompletionItemKind.Keyword,
            insertText: 'receive("$1") {$0}',
            insertTextFormat: InsertTextFormat.Snippet,
        })

        elements.push({
            label: "bounced(msg: <type>) {}",
            kind: CompletionItemKind.Keyword,
            insertText: "bounced(msg: $1) {$0}",
            insertTextFormat: InsertTextFormat.Snippet,
        })
    }
}
