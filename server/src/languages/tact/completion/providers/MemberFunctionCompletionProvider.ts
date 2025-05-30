//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type {CompletionProvider} from "@server/languages/tact/completion/CompletionProvider"
import {CompletionItemKind, InsertTextFormat} from "vscode-languageserver-types"
import type {CompletionContext} from "@server/languages/tact/completion/CompletionContext"
import {
    CompletionResult,
    CompletionWeight,
} from "@server/languages/tact/completion/WeightedCompletionItem"

export class MemberFunctionCompletionProvider implements CompletionProvider {
    public isAvailable(ctx: CompletionContext): boolean {
        return ctx.topLevelInTraitOrContract
    }

    public addCompletion(ctx: CompletionContext, result: CompletionResult): void {
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
