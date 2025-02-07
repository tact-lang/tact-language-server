import {CompletionProvider} from "@server/completion/CompletionProvider"
import {CompletionItemKind, InsertTextFormat} from "vscode-languageserver-types"
import {CompletionContext} from "@server/completion/CompletionContext"
import {
    CompletionResult,
    CompletionWeight,
    contextWeight,
} from "@server/completion/WeightedCompletionItem"
import {NullTy, PrimitiveTy} from "@server/types/BaseTy"

export class KeywordsCompletionProvider implements CompletionProvider {
    boolTy: PrimitiveTy = new PrimitiveTy("Bool", null)
    nullTy: NullTy = new NullTy()

    isAvailable(ctx: CompletionContext): boolean {
        return ctx.expression() && !ctx.inNameOfFieldInit
    }

    addCompletion(ctx: CompletionContext, result: CompletionResult): void {
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
            weight: contextWeight(CompletionWeight.KEYWORD, expectedNull),
        })
    }
}
