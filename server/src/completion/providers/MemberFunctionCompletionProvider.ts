import {CompletionProvider} from "@server/completion/CompletionProvider"
import {CompletionItemKind, InsertTextFormat} from "vscode-languageserver-types"
import {CompletionContext} from "@server/completion/CompletionContext"
import {CompletionResult, CompletionWeight} from "@server/completion/WeightedCompletionItem"

export class MemberFunctionCompletionProvider implements CompletionProvider {
    isAvailable(ctx: CompletionContext): boolean {
        return ctx.topLevelInTraitOrContract
    }

    addCompletion(ctx: CompletionContext, result: CompletionResult): void {
        const funLabel = "fun"
        const funTemplate = "fun $1($2)$3 {$0}"
        const modifiers = ["inline", "get"]

        result.add({
            label: funLabel,
            labelDetails: {
                detail: " name() {}",
            },
            kind: CompletionItemKind.Keyword,
            insertText: funTemplate,
            insertTextFormat: InsertTextFormat.Snippet,
            weight: CompletionWeight.KEYWORD,
        })

        modifiers.forEach(modifier => {
            result.add({
                label: modifier + " " + funLabel,
                labelDetails: {
                    detail: " name() {}",
                },
                kind: CompletionItemKind.Keyword,
                insertText: modifier + " " + funTemplate,
                insertTextFormat: InsertTextFormat.Snippet,
                weight: CompletionWeight.KEYWORD,
            })
        })

        if (ctx.insideTrait) {
            result.add({
                label: "abstract fun",
                labelDetails: {
                    detail: " name();",
                },
                kind: CompletionItemKind.Keyword,
                insertText: "abstract fun $1($2)$3;",
                insertTextFormat: InsertTextFormat.Snippet,
                weight: CompletionWeight.KEYWORD,
            })

            result.add({
                label: "virtual fun",
                labelDetails: {
                    detail: " name() {}",
                },
                kind: CompletionItemKind.Keyword,
                insertText: "virtual fun $1($2)$3 {$0}",
                insertTextFormat: InsertTextFormat.Snippet,
                weight: CompletionWeight.KEYWORD,
            })
        }
    }
}
