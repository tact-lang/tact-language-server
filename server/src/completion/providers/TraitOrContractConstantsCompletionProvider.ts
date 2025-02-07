import {CompletionProvider} from "@server/completion/CompletionProvider"
import {CompletionItemKind, InsertTextFormat} from "vscode-languageserver-types"
import {CompletionContext} from "@server/completion/CompletionContext"
import {CompletionResult, CompletionWeight} from "@server/completion/WeightedCompletionItem"

export class TraitOrContractConstantsCompletionProvider implements CompletionProvider {
    isAvailable(ctx: CompletionContext): boolean {
        return ctx.topLevelInTraitOrContract
    }

    addCompletion(_ctx: CompletionContext, result: CompletionResult): void {
        result.add({
            label: `const`,
            labelDetails: {
                detail: " Foo: <type> = <value>",
            },
            kind: CompletionItemKind.Keyword,
            insertText: "const ${1:Name}: ${2:Int} = ${3:0};$0",
            insertTextFormat: InsertTextFormat.Snippet,
            weight: CompletionWeight.KEYWORD,
        })
    }
}
