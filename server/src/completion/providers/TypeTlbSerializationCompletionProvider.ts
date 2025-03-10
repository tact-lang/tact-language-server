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
    ]

    public isAvailable(ctx: CompletionContext): boolean {
        if (!ctx.isType) return false
        const node = ctx.element.node
        const parent = node.parent
        if (!parent) return false

        if (parent.type === "storage_variable" || parent.type === "field") {
            const field = new Field(parent, ctx.element.file)
            const typeNode = field.typeNode()
            if (!typeNode) return false
            // contract Foo {
            //     foo: <caret>;
            //     ^^^^^^^^^^^^^ field is complete
            // }
            return typeNode.node.equals(node)
        }

        // contract Foo {
        //     foo: <caret>
        //        ^ ^^^^^^^ type context
        //        |
        //        colon
        // }
        return (
            parent.type === "ERROR" &&
            parent.parent?.type === "contract_body" &&
            node.previousSibling?.text === ":"
        )
    }

    public addCompletion(ctx: CompletionContext, result: CompletionResult): void {
        for (const type of this.types) {
            // contract Foo {
            //     foo: <caret>;
            //                 ^ semi, don't add second one
            // }
            const semicolon = ctx.beforeSemicolon ? "" : ";"

            result.add({
                label: type[0].toUpperCase() + type.slice(1),
                kind: CompletionItemKind.Keyword,
                insertTextFormat: InsertTextFormat.Snippet,
                insertText: `Int as ${type}${semicolon}`,
                weight: CompletionWeight.CONTEXT_ELEMENT,
            })
        }
    }
}
