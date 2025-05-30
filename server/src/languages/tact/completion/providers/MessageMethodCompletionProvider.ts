//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type {CompletionProvider} from "@server/languages/tact/completion/CompletionProvider"
import {CompletionItemKind, InsertTextFormat} from "vscode-languageserver-types"
import type {CompletionContext} from "@server/languages/tact/completion/CompletionContext"
import {
    CompletionResult,
    CompletionWeight,
} from "@server/languages/tact/completion/WeightedCompletionItem"

export class MessageMethodCompletionProvider implements CompletionProvider {
    public isAvailable(ctx: CompletionContext): boolean {
        return ctx.topLevelInTraitOrContract
    }

    public addCompletion(_ctx: CompletionContext, result: CompletionResult): void {
        const options = ["receive", "external"]
        options.forEach(name => {
            result.add({
                label: name,
                labelDetails: {
                    detail: "(msg: <type>) {}",
                },
                kind: CompletionItemKind.Keyword,
                insertText: `${name}(msg: $1) {$0}`,
                insertTextFormat: InsertTextFormat.Snippet,
                weight: CompletionWeight.KEYWORD,
            })

            result.add({
                label: name,
                labelDetails: {
                    detail: `("<message>") {}`,
                },
                kind: CompletionItemKind.Keyword,
                insertText: `${name}("$1") {$0}`,
                insertTextFormat: InsertTextFormat.Snippet,
                weight: CompletionWeight.KEYWORD,
            })

            result.add({
                label: name,
                labelDetails: {
                    detail: `() {}`,
                },
                kind: CompletionItemKind.Keyword,
                insertText: `${name}() {$0}`,
                insertTextFormat: InsertTextFormat.Snippet,
                weight: CompletionWeight.KEYWORD,
            })
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
