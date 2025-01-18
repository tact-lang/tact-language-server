import {CompletionProvider} from "../CompletionProvider"
import {CompletionItem, CompletionItemKind} from "vscode-languageserver-types"
import {CompletionContext} from "../CompletionContext"

export class SelfCompletionProvider implements CompletionProvider {
    isAvailable(ctx: CompletionContext): boolean {
        return ctx.expression() && ctx.insideTraitOrContract
    }

    addCompletion(_ctx: CompletionContext, elements: CompletionItem[]): void {
        elements.push({
            label: "self",
            kind: CompletionItemKind.Keyword,
        })
    }
}
