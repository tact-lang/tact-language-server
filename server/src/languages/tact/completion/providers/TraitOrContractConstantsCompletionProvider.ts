//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type {CompletionProvider} from "@server/languages/tact/completion/CompletionProvider"
import {CompletionItemKind, InsertTextFormat} from "vscode-languageserver-types"
import type {CompletionContext} from "@server/languages/tact/completion/CompletionContext"
import {
    CompletionResult,
    CompletionWeight,
} from "@server/languages/tact/completion/WeightedCompletionItem"

export class TraitOrContractConstantsCompletionProvider implements CompletionProvider {
    public isAvailable(ctx: CompletionContext): boolean {
        return ctx.topLevelInTraitOrContract
    }

    public addCompletion(_ctx: CompletionContext, result: CompletionResult): void {
        result.add({
            label: `const`,
            labelDetails: {
                detail: " Foo: <type> = <value>",
            },
            kind: CompletionItemKind.Keyword,
            insertText: "const ${1:Foo}: ${2:Int} = ${3:0};$0",
            insertTextFormat: InsertTextFormat.Snippet,
            weight: CompletionWeight.KEYWORD,
        })
    }
}
