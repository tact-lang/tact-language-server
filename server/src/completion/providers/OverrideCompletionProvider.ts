import type {CompletionProvider} from "@server/completion/CompletionProvider"
import {CompletionItemKind, InsertTextFormat} from "vscode-languageserver-types"
import type {CompletionContext} from "@server/completion/CompletionContext"
import {parentOfType} from "@server/psi/utils"
import {StorageMembersOwner} from "@server/psi/Decls"
import {CompletionResult, CompletionWeight} from "@server/completion/WeightedCompletionItem"

export class OverrideCompletionProvider implements CompletionProvider {
    public isAvailable(ctx: CompletionContext): boolean {
        return ctx.topLevelInTraitOrContract
    }

    public addCompletion(ctx: CompletionContext, result: CompletionResult): void {
        const ownerNode = parentOfType(ctx.element.node, "trait", "contract")
        if (!ownerNode) return

        const owner = new StorageMembersOwner(ownerNode, ctx.element.file)

        const inheritMethods = owner.inheritTraits().flatMap(trait => trait.methods())

        const added: Set<string> = new Set()

        // add already defined methods to avoid duplicates
        for (const ownMethod of owner.ownMethods()) {
            added.add(ownMethod.name())
        }

        for (const method of inheritMethods) {
            if (!method.isOverride() && !method.isVirtual() && !method.isAbstract()) continue
            if (added.has(method.name())) continue

            const methodOwner = method.owner()
            if (methodOwner === null) continue

            result.add({
                label: `override`,
                kind: CompletionItemKind.Function,
                labelDetails: {
                    detail: ` fun ${method.name()}${method.signaturePresentation()} {} of ${methodOwner.name()}`,
                },
                insertText: `override fun ${method.name()}${method.signaturePresentation()} {$0}`,
                insertTextFormat: InsertTextFormat.Snippet,
                weight: CompletionWeight.KEYWORD,
            })

            added.add(method.name())
        }
    }
}
