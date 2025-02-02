import {CompletionProvider} from "@server/completion/CompletionProvider"
import {CompletionItemKind, InsertTextFormat} from "vscode-languageserver-types"
import {CompletionContext} from "@server/completion/CompletionContext"
import {CompletionResult, CompletionWeight} from "@server/completion/WeightedCompletionItem"

export class TopLevelFunctionCompletionProvider implements CompletionProvider {
    isAvailable(ctx: CompletionContext): boolean {
        return ctx.topLevel
    }

    addCompletion(_ctx: CompletionContext, result: CompletionResult): void {
        const funLabel = " name() {}"
        const funTemplate = "$1($2)$3 {$0}"
        const extendsTemplate = "$1(self: $2$3)$4 {$0}"

        result.add({
            label: `fun`,
            labelDetails: {
                detail: funLabel,
            },
            kind: CompletionItemKind.Keyword,
            insertText: `fun ${funTemplate}`,
            insertTextFormat: InsertTextFormat.Snippet,
            weight: CompletionWeight.KEYWORD,
        })

        result.add({
            label: `asm fun`,
            labelDetails: {
                detail: funLabel,
            },
            kind: CompletionItemKind.Keyword,
            insertText: `asm fun ${funTemplate}`,
            insertTextFormat: InsertTextFormat.Snippet,
            weight: CompletionWeight.KEYWORD,
        })

        result.add({
            label: `native`,
            labelDetails: {
                detail: funLabel,
            },
            kind: CompletionItemKind.Keyword,
            insertText: `@name($4)\nnative $1($2)$3;$0`,
            insertTextFormat: InsertTextFormat.Snippet,
            weight: CompletionWeight.KEYWORD,
        })

        result.add({
            label: "extends fun",
            labelDetails: {
                detail: " name(self: <type>) {}",
            },
            kind: CompletionItemKind.Keyword,
            insertText: `extends fun ${extendsTemplate}`,
            insertTextFormat: InsertTextFormat.Snippet,
            weight: CompletionWeight.KEYWORD,
        })

        result.add({
            label: "extends native",
            labelDetails: {
                detail: " name(self: <type>);",
            },
            kind: CompletionItemKind.Keyword,
            insertText: `@name($5)\nextends native $1(self: $2$3)$4;`,
            insertTextFormat: InsertTextFormat.Snippet,
            weight: CompletionWeight.KEYWORD,
        })
    }
}
