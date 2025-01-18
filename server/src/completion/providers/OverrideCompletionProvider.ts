import {CompletionProvider} from "../CompletionProvider"
import {CompletionItem, CompletionItemKind, InsertTextFormat} from "vscode-languageserver-types"
import {CompletionContext} from "../CompletionContext"
import {parentOfType} from "../../psi/utils"
import {StorageMembersOwner} from "../../psi/TopLevelDeclarations"

export class OverrideCompletionProvider implements CompletionProvider {
    isAvailable(ctx: CompletionContext): boolean {
        return ctx.topLevelInTraitOrContract
    }

    addCompletion(ctx: CompletionContext, elements: CompletionItem[]): void {
        const ownerNode = parentOfType(ctx.element.node, "trait", "contract")
        if (!ownerNode) return

        const owner = new StorageMembersOwner(ownerNode, ctx.element.file)

        const inheritMethods = owner.inheritTraits().flatMap(trait => trait.methods())

        const added = new Set<string>()

        // add already defined methods to avoid duplicates
        for (const ownMethod of owner.ownMethods()) {
            added.add(ownMethod.name())
        }

        for (const method of inheritMethods) {
            if (added.has(method.name())) continue

            const methodOwner = method.owner()
            if (methodOwner === null) continue

            elements.push({
                label: `override fun ${method.name()}${method.signatureText()} {}`,
                kind: CompletionItemKind.Function,
                labelDetails: {
                    detail: ` of ${methodOwner.name()}`,
                },
                insertText: `override fun ${method.name()}${method.signatureText()} {$0}`,
                insertTextFormat: InsertTextFormat.Snippet,
            })

            added.add(method.name())
        }
    }
}
