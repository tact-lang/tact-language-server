import {CompletionProvider} from "@server/completion/CompletionProvider"
import {CompletionItem, CompletionItemKind, InsertTextFormat} from "vscode-languageserver-types"
import {CompletionContext} from "@server/completion/CompletionContext"

export class ContractDeclCompletionProvider implements CompletionProvider {
    isAvailable(ctx: CompletionContext): boolean {
        return ctx.topLevel
    }

    addCompletion(_ctx: CompletionContext, elements: CompletionItem[]): void {
        elements.push({
            label: `contract`,
            labelDetails: {
                detail: " Name {}",
            },
            kind: CompletionItemKind.Keyword,
            insertText: "contract ${1:Name} {$0}",
            insertTextFormat: InsertTextFormat.Snippet,
        })

        elements.push({
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
