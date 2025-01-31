import {CompletionProvider} from "@server/completion/CompletionProvider"
import {CompletionItem, CompletionItemKind, InsertTextFormat} from "vscode-languageserver-types"
import {CompletionContext} from "@server/completion/CompletionContext"

export class MapTypeCompletionProvider implements CompletionProvider {
    isAvailable(ctx: CompletionContext): boolean {
        return ctx.isType && !ctx.inTraitList
    }

    addCompletion(_ctx: CompletionContext, elements: CompletionItem[]): void {
        elements.push({
            label: "map<K, V>",
            kind: CompletionItemKind.Keyword,
            insertText: "map<${1:Int}, ${2:String}>",
            insertTextFormat: InsertTextFormat.Snippet,
        })
    }
}
