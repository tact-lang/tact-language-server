import {CompletionProvider} from "../CompletionProvider"
import {CompletionItem} from "vscode-languageserver-types"
import {CompletionContext} from "../CompletionContext"
import {Reference, ResolveState} from "../../psi/Reference"
import {ReferenceCompletionProcessor} from "../ReferenceCompletionProcessor"

export class ReferenceCompletionProvider implements CompletionProvider {
    constructor(private ref: Reference) {}

    isAvailable(ctx: CompletionContext): boolean {
        return (
            !ctx.topLevelInTraitOrContract &&
            !ctx.topLevelInStructOrMessage &&
            !ctx.topLevel &&
            !ctx.inTlbSerialization &&
            !ctx.inParameter
        )
    }

    addCompletion(ctx: CompletionContext, elements: CompletionItem[]): void {
        const state = new ResolveState()
        const processor = new ReferenceCompletionProcessor(ctx)
        this.ref.processResolveVariants(processor, state.withValue("completion", "true"))

        elements.push(...processor.result.values())
    }
}
