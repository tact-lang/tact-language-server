import {CompletionProvider} from "@server/completion/CompletionProvider"
import {CompletionItemKind, InsertTextFormat} from "vscode-languageserver-types"
import {CompletionContext} from "@server/completion/CompletionContext"
import {CompletionResult, CompletionWeight} from "@server/completion/WeightedCompletionItem"

export class TlbSerializationCompletionProvider implements CompletionProvider {
    // see https://docs.tact-lang.org/book/integers/#common-serialization-types
    types: string[] = [
        "uint8",
        "uint16",
        "uint32",
        "uint64",
        "uint128",
        "uint256",
        "int8",
        "int16",
        "int32",
        "int64",
        "int128",
        "int256",
        "int257",
        "coins",
        "int{X}",
        "uint{X}",
    ]

    isAvailable(ctx: CompletionContext): boolean {
        return ctx.inTlbSerialization
    }

    addCompletion(_ctx: CompletionContext, result: CompletionResult): void {
        for (const type of this.types) {
            result.add({
                label: type,
                kind: CompletionItemKind.Keyword,
                insertTextFormat: InsertTextFormat.Snippet,
                insertText: type.includes("{X}") ? type.replace("{X}", "$1") : type,
                weight: CompletionWeight.CONTEXT_ELEMENT,
            })
        }
    }
}
