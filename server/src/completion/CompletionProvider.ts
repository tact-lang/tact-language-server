import {CompletionContext} from "./CompletionContext"
import {CompletionItem} from "vscode-languageserver-types"

export interface CompletionProvider {
    isAvailable(ctx: CompletionContext): boolean
    addCompletion(ctx: CompletionContext, elements: CompletionItem[]): void
}
