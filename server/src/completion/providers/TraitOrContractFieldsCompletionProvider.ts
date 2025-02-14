import type {CompletionProvider} from "@server/completion/CompletionProvider"
import {CompletionItemKind, InsertTextFormat} from "vscode-languageserver-types"
import type {CompletionContext} from "@server/completion/CompletionContext"
import {parentOfType} from "@server/psi/utils"
import {StorageMembersOwner} from "@server/psi/Decls"
import {CompletionResult, CompletionWeight} from "@server/completion/WeightedCompletionItem"

export class TraitOrContractFieldsCompletionProvider implements CompletionProvider {
    public isAvailable(ctx: CompletionContext): boolean {
        return ctx.topLevelInTraitOrContract
    }

    public addCompletion(ctx: CompletionContext, result: CompletionResult): void {
        const ownerNode = parentOfType(ctx.element.node, "trait", "contract")
        if (!ownerNode) return

        const owner = new StorageMembersOwner(ownerNode, ctx.element.file)

        const inheritFields = owner.inheritTraits().flatMap(trait => trait.fields())

        const added: Set<string> = new Set()

        // add already defined fields to avoid duplicates
        for (const ownField of owner.ownFields()) {
            added.add(ownField.name())
        }

        for (const field of inheritFields) {
            if (added.has(field.name())) continue

            const fieldOwner = field.owner()
            if (fieldOwner === null) continue

            const type = field.typeNode()?.type()?.qualifiedName() ?? "unknown"

            result.add({
                label: `${field.name()}: ${type};`,
                kind: CompletionItemKind.Property,
                labelDetails: {
                    detail: ` of ${fieldOwner.name()}`,
                },
                insertText: `${field.name()}: ${type};$0`,
                insertTextFormat: InsertTextFormat.Snippet,
                weight: CompletionWeight.CONTEXT_ELEMENT,
            })

            added.add(field.name())
        }
    }
}
