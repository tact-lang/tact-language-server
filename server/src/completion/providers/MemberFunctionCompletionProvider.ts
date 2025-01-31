import {CompletionProvider} from "../CompletionProvider"
import {CompletionItem, CompletionItemKind, InsertTextFormat} from "vscode-languageserver-types"
import {CompletionContext} from "../CompletionContext"

export class MemberFunctionCompletionProvider implements CompletionProvider {
    isAvailable(ctx: CompletionContext): boolean {
        return ctx.topLevelInTraitOrContract
    }

    addCompletion(ctx: CompletionContext, elements: CompletionItem[]): void {
        const funLabel = "fun"
        const funTemplate = "fun $1($2)$3 {$0}"
        const modifiers = ["inline", "get"]

        elements.push({
            label: funLabel,
            labelDetails: {
                detail: " name() {}",
            },
            kind: CompletionItemKind.Keyword,
            insertText: funTemplate,
            insertTextFormat: InsertTextFormat.Snippet,
        })

        modifiers.forEach(modifier => {
            elements.push({
                label: modifier + " " + funLabel,
                labelDetails: {
                    detail: " name() {}",
                },
                kind: CompletionItemKind.Keyword,
                insertText: modifier + " " + funTemplate,
                insertTextFormat: InsertTextFormat.Snippet,
            })
        })

        if (ctx.insideTrait) {
            elements.push({
                label: "abstract fun",
                labelDetails: {
                    detail: " name();",
                },
                kind: CompletionItemKind.Keyword,
                insertText: "abstract fun $1($2)$3;",
                insertTextFormat: InsertTextFormat.Snippet,
            })
        }
    }
}
