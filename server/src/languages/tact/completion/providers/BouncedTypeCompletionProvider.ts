//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type {CompletionProvider} from "@server/languages/tact/completion/CompletionProvider"
import {CompletionItemKind, InsertTextFormat} from "vscode-languageserver-types"
import type {CompletionContext} from "@server/languages/tact/completion/CompletionContext"
import {
    CompletionResult,
    CompletionWeight,
} from "@server/languages/tact/completion/WeightedCompletionItem"

export class BouncedTypeCompletionProvider implements CompletionProvider {
    public isAvailable(ctx: CompletionContext): boolean {
        return ctx.isType && ctx.isBouncedMessage
    }

    public addCompletion(_ctx: CompletionContext, result: CompletionResult): void {
        result.add({
            label: "bounced<Type>",
            kind: CompletionItemKind.Keyword,
            insertText: "bounced<$1>$0",
            insertTextFormat: InsertTextFormat.Snippet,
            weight: CompletionWeight.KEYWORD,
        })
    }
}
