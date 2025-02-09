import type {CompletionProvider} from "@server/completion/CompletionProvider"
import {CompletionItemKind, InsertTextFormat} from "vscode-languageserver-types"
import type {CompletionContext} from "@server/completion/CompletionContext"
import type {CompletionResult} from "@server/completion/WeightedCompletionItem"

export class ContractDeclCompletionProvider implements CompletionProvider {
    public isAvailable(ctx: CompletionContext): boolean {
        return ctx.topLevel
    }

    public addCompletion(_ctx: CompletionContext, result: CompletionResult): void {
        result.add({
            label: `contract`,
            labelDetails: {
                detail: " Name {}",
            },
            kind: CompletionItemKind.Keyword,
            insertText: "contract ${1:Name} {$0}",
            insertTextFormat: InsertTextFormat.Snippet,
        })

        result.add({
            label: `contract`,
            labelDetails: {
                detail: " Name with Trait {}",
            },
            kind: CompletionItemKind.Keyword,
            insertText: "contract ${1:Name} with ${2:Trait} {$0}",
            insertTextFormat: InsertTextFormat.Snippet,
        })
    }
}
