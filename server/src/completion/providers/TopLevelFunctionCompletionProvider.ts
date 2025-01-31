import {CompletionProvider} from "@server/completion/CompletionProvider"
import {CompletionItem, CompletionItemKind, InsertTextFormat} from "vscode-languageserver-types"
import {CompletionContext} from "@server/completion/CompletionContext"

export class TopLevelFunctionCompletionProvider implements CompletionProvider {
    isAvailable(ctx: CompletionContext): boolean {
        return ctx.topLevel
    }

    addCompletion(_ctx: CompletionContext, elements: CompletionItem[]): void {
        const funLabel = " name() {}"
        const funTemplate = "$1($2)$3 {$0}"
        const extendsTemplate = "$1(self: $2$3)$4 {$0}"

        elements.push({
            label: `fun`,
            labelDetails: {
                detail: funLabel,
            },
            kind: CompletionItemKind.Keyword,
            insertText: `fun ${funTemplate}`,
            insertTextFormat: InsertTextFormat.Snippet,
        })

        elements.push({
            label: `asm fun`,
            labelDetails: {
                detail: funLabel,
            },
            kind: CompletionItemKind.Keyword,
            insertText: `asm fun ${funTemplate}`,
            insertTextFormat: InsertTextFormat.Snippet,
        })

        elements.push({
            label: `native`,
            labelDetails: {
                detail: funLabel,
            },
            kind: CompletionItemKind.Keyword,
            insertText: `@name($4)\nnative $1($2)$3;$0`,
            insertTextFormat: InsertTextFormat.Snippet,
        })

        elements.push({
            label: "extends fun",
            labelDetails: {
                detail: " name(self: <type>) {}",
            },
            kind: CompletionItemKind.Keyword,
            insertText: `extends fun ${extendsTemplate}`,
            insertTextFormat: InsertTextFormat.Snippet,
        })

        elements.push({
            label: "extends native",
            labelDetails: {
                detail: " name(self: <type>);",
            },
            kind: CompletionItemKind.Keyword,
            insertText: `@name($5)\nextends native $1(self: $2$3)$4;`,
            insertTextFormat: InsertTextFormat.Snippet,
        })
    }
}
