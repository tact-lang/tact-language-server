import {CompletionProvider} from "../CompletionProvider"
import {CompletionItem, CompletionItemKind, InsertTextFormat} from "vscode-languageserver-types"
import {CompletionContext} from "../CompletionContext"
import {parentOfType} from "../../psi/utils"
import {StorageMembersOwner} from "../../psi/Decls"

export class TraitOrContractFieldsCompletionProvider implements CompletionProvider {
    isAvailable(ctx: CompletionContext): boolean {
        return ctx.topLevelInTraitOrContract
    }

    addCompletion(ctx: CompletionContext, elements: CompletionItem[]): void {
        const ownerNode = parentOfType(ctx.element.node, "trait", "contract")
        if (!ownerNode) return

        const owner = new StorageMembersOwner(ownerNode, ctx.element.file)

        const inheritFields = owner.inheritTraits().flatMap(trait => trait.fields())

        const added = new Set<string>()

        // add already defined fields to avoid duplicates
        for (const ownField of owner.ownFields()) {
            added.add(ownField.name())
        }

        for (const field of inheritFields) {
            if (added.has(field.name())) continue

            const fieldOwner = field.owner()
            if (fieldOwner === null) continue

            const type = field.typeNode()?.type()?.qualifiedName() ?? "unknown"

            elements.push({
                label: `${field.name()}: ${type};`,
                kind: CompletionItemKind.Property,
                labelDetails: {
                    detail: ` of ${fieldOwner.name()}`,
                },
                insertText: `${field.name()}: ${type};$0`,
                insertTextFormat: InsertTextFormat.Snippet,
            })

            added.add(field.name())
        }
    }
}
