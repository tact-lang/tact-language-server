import type {CompletionProvider} from "@server/completion/CompletionProvider"
import {CompletionItemKind, InsertTextFormat} from "vscode-languageserver-types"
import type {CompletionContext} from "@server/completion/CompletionContext"
import {CompletionResult, CompletionWeight} from "@server/completion/WeightedCompletionItem"
import {Field} from "@server/psi/Decls"

export class TypeTlbSerializationCompletionProvider implements CompletionProvider {
    // see https://docs.tact-lang.org/book/integers/#common-serialization-types
    private readonly types: string[] = [
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

    public isAvailable(ctx: CompletionContext): boolean {
        return (
            ctx.isType ||
            ctx.element.node.parent?.type === "storage_variable" ||
            (ctx.element.node.parent?.type === "ERROR" &&
                ctx.element.node.parent?.parent?.type === "contract_body" &&
                ctx.element.node.previousSibling?.text === ":")
        )
    }

    public addCompletion(ctx: CompletionContext, result: CompletionResult): void {
        const fieldNode = ctx.element.node.parent
        const isField = fieldNode?.type !== "field" && fieldNode?.type !== "storage_variable"

        const fieldNode2 = ctx.element.node.parent?.parent
        const isField2 = fieldNode2?.type !== "field" && fieldNode2?.type !== "storage_variable"

        if (!isField && !isField2) return

        for (const type of this.types) {
            result.add({
                label: type,
                kind: CompletionItemKind.Keyword,
                insertTextFormat: InsertTextFormat.Snippet,
                insertText: `Int as ${type};`,
                weight: CompletionWeight.CONTEXT_ELEMENT,
            })
        }
    }
}
