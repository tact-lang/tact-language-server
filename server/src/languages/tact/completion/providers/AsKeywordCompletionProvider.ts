//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type {CompletionProvider} from "@server/languages/tact/completion/CompletionProvider"
import {CompletionItemKind, InsertTextFormat} from "vscode-languageserver-types"
import type {CompletionContext} from "@server/languages/tact/completion/CompletionContext"
import {
    CompletionResult,
    CompletionWeight,
} from "@server/languages/tact/completion/WeightedCompletionItem"

export class AsKeywordCompletionProvider implements CompletionProvider {
    public isAvailable(ctx: CompletionContext): boolean {
        return ctx.afterFieldType
    }

    public addCompletion(_ctx: CompletionContext, result: CompletionResult): void {
        result.add({
            label: "as",
            labelDetails: {
                detail: " type",
            },
            kind: CompletionItemKind.Keyword,
            insertText: "as $0",
            insertTextFormat: InsertTextFormat.Snippet,
            weight: CompletionWeight.CONTEXT_ELEMENT,
        })
    }
}
