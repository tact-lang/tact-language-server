import {CompletionProvider} from "@server/completion/CompletionProvider"
import {CompletionItemKind, InsertTextFormat} from "vscode-languageserver-types"
import {CompletionContext} from "@server/completion/CompletionContext"
import {CompletionResult} from "@server/completion/WeightedCompletionItem"

export class ContractDeclCompletionProvider implements CompletionProvider {
    isAvailable(ctx: CompletionContext): boolean {
        return ctx.topLevel
    }

    addCompletion(_ctx: CompletionContext, result: CompletionResult): void {
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
