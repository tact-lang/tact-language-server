//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type {CompletionProvider} from "@server/languages/tact/completion/CompletionProvider"
import {CompletionItemKind} from "vscode-languageserver-types"
import type {CompletionContext} from "@server/languages/tact/completion/CompletionContext"
import {
    CompletionResult,
    CompletionWeight,
} from "@server/languages/tact/completion/WeightedCompletionItem"
import {DATA} from "@server/languages/tact/documentation/exit_code_documentation"

export class ExitCodesCompletionProvider implements CompletionProvider {
    public isAvailable(ctx: CompletionContext): boolean {
        return ctx.expression()
    }

    public addCompletion(_ctx: CompletionContext, result: CompletionResult): void {
        const entries = Object.entries(DATA)

        for (const entry of entries) {
            result.add({
                label: entry[0].toString(),
                labelDetails: {
                    description: " " + (entry[1]?.description ?? ""),
                },
                kind: CompletionItemKind.Keyword,
                weight: CompletionWeight.CONTEXT_ELEMENT,
            })
        }
    }
}
