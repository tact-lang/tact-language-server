import {CompletionProvider} from "@server/completion/CompletionProvider"
import {CompletionItem, CompletionItemKind} from "vscode-languageserver-types"
import {CompletionContext} from "@server/completion/CompletionContext"

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
