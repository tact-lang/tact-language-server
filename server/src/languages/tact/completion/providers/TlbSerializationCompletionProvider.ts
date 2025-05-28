//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type {CompletionProvider} from "@server/languages/tact/completion/CompletionProvider"
import {CompletionItemKind, InsertTextFormat} from "vscode-languageserver-types"
import type {CompletionContext} from "@server/languages/tact/completion/CompletionContext"
import {
    CompletionResult,
    CompletionWeight,
} from "@server/languages/tact/completion/WeightedCompletionItem"
import {Field} from "@server/languages/tact/psi/Decls"

export class TlbSerializationCompletionProvider implements CompletionProvider {
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
        return ctx.inTlbSerialization
    }

    public addCompletion(ctx: CompletionContext, result: CompletionResult): void {
        const fieldNode = ctx.element.node.parent?.parent
        if (fieldNode?.type !== "field" && fieldNode?.type !== "storage_variable") return

        const field = new Field(fieldNode, ctx.element.file)
        const type = field.typeNode()?.type()
        if (!type) return

        const semicolonPart = ctx.beforeSemicolon ? "" : ";"

        const typeName = type.name()
        if (typeName === "Cell" || typeName === "Slice" || typeName === "Builder") {
            result.add({
                label: "remaining",
                kind: CompletionItemKind.Keyword,
                insertText: `remaining${semicolonPart}`,
                weight: CompletionWeight.CONTEXT_ELEMENT,
            })
            return
        }

        if (typeName === "Int") {
            for (const type of this.types) {
                result.add({
                    label: type,
                    kind: CompletionItemKind.Keyword,
                    insertTextFormat: InsertTextFormat.Snippet,
                    insertText: type.includes("{X}")
                        ? type.replace("{X}", "$1")
                        : type + semicolonPart,
                    weight: CompletionWeight.CONTEXT_ELEMENT,
                })
            }
        }
    }
}
