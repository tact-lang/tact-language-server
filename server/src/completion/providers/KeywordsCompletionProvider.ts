//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type {CompletionProvider} from "@server/completion/CompletionProvider"
import {CompletionItemKind, InsertTextFormat} from "vscode-languageserver-types"
import type {CompletionContext} from "@server/completion/CompletionContext"
import {
    CompletionResult,
    CompletionWeight,
    contextWeight,
} from "@server/completion/WeightedCompletionItem"
import {NullTy, PrimitiveTy} from "@server/types/BaseTy"

export class KeywordsCompletionProvider implements CompletionProvider {
    private readonly boolTy: PrimitiveTy = new PrimitiveTy("Bool", null, null)
    private readonly nullTy: NullTy = new NullTy()

    public isAvailable(ctx: CompletionContext): boolean {
        return ctx.expression() && !ctx.inNameOfFieldInit
    }

    public addCompletion(ctx: CompletionContext, result: CompletionResult): void {
        const expectedBool = ctx.matchContextTy(() => this.boolTy)
        const expectedNull = ctx.matchContextTy(() => this.nullTy)

        result.add({
            label: "true",
            kind: CompletionItemKind.Keyword,
            weight: contextWeight(CompletionWeight.KEYWORD, expectedBool),
        })

        result.add({
            label: "false",
            kind: CompletionItemKind.Keyword,
            weight: contextWeight(CompletionWeight.KEYWORD, expectedBool),
        })

        result.add({
            label: "null",
            kind: CompletionItemKind.Keyword,
            weight: contextWeight(CompletionWeight.KEYWORD, expectedNull),
        })

        result.add({
            label: "initOf",
            labelDetails: {
                detail: " Contract(params)",
                description: " StateInit",
            },
            kind: CompletionItemKind.Keyword,
            insertText: "initOf $1($2)$0",
            insertTextFormat: InsertTextFormat.Snippet,
        })

        result.add({
            label: "codeOf",
            labelDetails: {
                detail: " Contract",
                description: " Cell",
            },
            kind: CompletionItemKind.Keyword,
            insertText: "codeOf $1$0",
            insertTextFormat: InsertTextFormat.Snippet,
        })
    }
}
