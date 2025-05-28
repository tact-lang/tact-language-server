//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type {CompletionProvider} from "@server/languages/tact/completion/CompletionProvider"
import {CompletionItemKind} from "vscode-languageserver-types"
import type {CompletionContext} from "@server/languages/tact/completion/CompletionContext"
import {
    CompletionResult,
    CompletionWeight,
} from "@server/languages/tact/completion/WeightedCompletionItem"

export class SelfCompletionProvider implements CompletionProvider {
    public isAvailable(ctx: CompletionContext): boolean {
        return ctx.expression() && ctx.insideTraitOrContract
    }

    public addCompletion(_ctx: CompletionContext, result: CompletionResult): void {
        result.add({
            label: "self",
            kind: CompletionItemKind.Keyword,
            weight: CompletionWeight.LOWEST,
        })
    }
}
