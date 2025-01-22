import {CompletionProvider} from "../CompletionProvider"
import {CompletionItem, CompletionItemKind, InsertTextFormat} from "vscode-languageserver-types"
import {CompletionContext} from "../CompletionContext"

export class MapTypeCompletionProvider implements CompletionProvider {
    isAvailable(ctx: CompletionContext): boolean {
        return ctx.isType
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
