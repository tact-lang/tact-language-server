//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type {CompletionProvider} from "@server/completion/CompletionProvider"
import {CompletionItemKind, InsertTextFormat} from "vscode-languageserver-types"
import type {CompletionContext} from "@server/completion/CompletionContext"
import {CompletionResult, CompletionWeight} from "@server/completion/WeightedCompletionItem"

export class TopLevelCompletionProvider implements CompletionProvider {
    public isAvailable(ctx: CompletionContext): boolean {
        return ctx.topLevel
    }

    public addCompletion(_ctx: CompletionContext, result: CompletionResult): void {
        result.add({
            label: `import`,
            labelDetails: {
                detail: ` "";`,
            },
            kind: CompletionItemKind.Keyword,
            insertText: `import "$1";$0`,
            insertTextFormat: InsertTextFormat.Snippet,
            weight: CompletionWeight.KEYWORD,
        })

        result.add({
            label: `struct`,
            labelDetails: {
                detail: " Name {}",
            },
            kind: CompletionItemKind.Keyword,
            insertText: "struct ${1:Name} {$0}",
            insertTextFormat: InsertTextFormat.Snippet,
            weight: CompletionWeight.KEYWORD,
        })

        result.add({
            label: `message`,
            labelDetails: {
                detail: " Name {}",
            },
            kind: CompletionItemKind.Keyword,
            insertText: "message ${1:Name} {$0}",
            insertTextFormat: InsertTextFormat.Snippet,
            weight: CompletionWeight.KEYWORD,
        })

        result.add({
            label: `message`,
            labelDetails: {
                detail: "(0xID) Name {}",
            },
            kind: CompletionItemKind.Keyword,
            insertText: "message(${1:0x00}) ${2:Name} {$0}",
            insertTextFormat: InsertTextFormat.Snippet,
            weight: CompletionWeight.KEYWORD,
        })

        result.add({
            label: `trait`,
            labelDetails: {
                detail: " Name {}",
            },
            kind: CompletionItemKind.Keyword,
            insertText: "trait ${1:Name} {$0}",
            insertTextFormat: InsertTextFormat.Snippet,
            weight: CompletionWeight.KEYWORD,
        })

        result.add({
            label: `trait`,
            labelDetails: {
                detail: " Name with Other {}",
            },
            kind: CompletionItemKind.Keyword,
            insertText: "trait ${1:Name} with ${2:Other} {$0}",
            insertTextFormat: InsertTextFormat.Snippet,
            weight: CompletionWeight.KEYWORD,
        })

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
