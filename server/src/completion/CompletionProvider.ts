import {CompletionContext} from "./CompletionContext"
import {CompletionResult} from "@server/completion/WeightedCompletionItem"

export interface CompletionProvider {
    isAvailable(ctx: CompletionContext): boolean
    addCompletion(ctx: CompletionContext, result: CompletionResult): void
}
