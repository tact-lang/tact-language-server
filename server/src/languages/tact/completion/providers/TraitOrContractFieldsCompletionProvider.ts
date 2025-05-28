//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type {CompletionProvider} from "@server/languages/tact/completion/CompletionProvider"
import {CompletionItemKind, InsertTextFormat} from "vscode-languageserver-types"
import type {CompletionContext} from "@server/languages/tact/completion/CompletionContext"
import {StorageMembersOwner} from "@server/languages/tact/psi/Decls"
import {
    CompletionResult,
    CompletionWeight,
} from "@server/languages/tact/completion/WeightedCompletionItem"

export class TraitOrContractFieldsCompletionProvider implements CompletionProvider {
    public isAvailable(ctx: CompletionContext): boolean {
        return ctx.topLevelInTraitOrContract
    }

    public addCompletion(ctx: CompletionContext, result: CompletionResult): void {
        const ownerNode = ctx.element.parentOfType("trait", "contract")
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
