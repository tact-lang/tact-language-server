import type {CompletionProvider} from "@server/completion/CompletionProvider"
import {CompletionItemKind, InsertTextFormat} from "vscode-languageserver-types"
import type {CompletionContext} from "@server/completion/CompletionContext"
import {CompletionResult, CompletionWeight} from "@server/completion/WeightedCompletionItem"
import {parentOfType} from "@server/psi/utils"
import {StorageMembersOwner} from "@server/psi/Decls"

export class GetterCompletionProvider implements CompletionProvider {
    public isAvailable(ctx: CompletionContext): boolean {
        return ctx.topLevelInTraitOrContract
    }

    public addCompletion(ctx: CompletionContext, result: CompletionResult): void {
        const ownerNode = parentOfType(ctx.element.node, "trait", "contract")
        if (!ownerNode) return

        const owner = new StorageMembersOwner(ownerNode, ctx.element.file)

        const fields = owner.fields()

        fields.forEach(field => {
            const type = field.typeNode()?.type()
            if (!type || field.name() === "DummyIdentifier") return

            result.add({
                label: field.name(),
                labelDetails: {
                    description: `generate getter for "${field.name()}" field`,
                },
                kind: CompletionItemKind.Keyword,
                insertText: `get fun ${field.name()}(): ${type.qualifiedName()} {\n\treturn self.${field.name()};\n}`,
                insertTextFormat: InsertTextFormat.Snippet,
                weight: CompletionWeight.SNIPPET,
            })
        })

        if (owner.node.type === "contract") {
            result.add({
                label: "state",
                labelDetails: {
                    description: `generate getter for all contract state`,
                },
                kind: CompletionItemKind.Keyword,
                insertText: `get fun contractState(): ${owner.name()} {\n\treturn self;\n}`,
                insertTextFormat: InsertTextFormat.Snippet,
                weight: CompletionWeight.SNIPPET,
            })
        }
    }
}
