//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type {CompletionProvider} from "@server/completion/CompletionProvider"
import {CompletionItemKind, InsertTextFormat} from "vscode-languageserver-types"
import type {CompletionContext} from "@server/completion/CompletionContext"
import {CompletionResult, CompletionWeight} from "@server/completion/WeightedCompletionItem"
import {asLspRange} from "@server/utils/position"
import type {Node as SyntaxNode} from "web-tree-sitter"

export class PostfixCompletionProvider implements CompletionProvider {
    public isAvailable(ctx: CompletionContext): boolean {
        return ctx.afterDot
    }

    public addCompletion(ctx: CompletionContext, result: CompletionResult): void {
        this.postfix(ctx, "not", "Negate expression", "!$expr", result)
        this.postfix(ctx, "call", "Use as function argument", "($expr)", result)

        if (ctx.isSelectorExpressionInStatement) {
            this.postfix(ctx, "if", "Create if statement", "if ($expr) {}", result)
            this.postfix(ctx, "let", "Create variable", "let name = $expr;", result)
            this.postfix(ctx, "repeat", "Create repeat loop", "repeat($expr) {}", result)
            this.postfix(ctx, "do", "Create do-until loop", "do {} until ($expr);", result)
        }
    }

    private postfix(
        ctx: CompletionContext,
        selector: string,
        description: string,
        snippet: string,
        result: CompletionResult,
    ): void {
        const expr = ctx.element.node.parent
        if (expr?.type !== "field_access_expression") return
        const object = expr.childForFieldName("object")
        if (!object) return

        const finalObject = this.unwrapParens(object)
        if (!finalObject) return

        const objectRange = asLspRange(object)

        const replacedSnippet = snippet.replace("$expr", finalObject.text)
        const preparedSnippet =
            ctx.beforeSemicolon && snippet.endsWith(";")
                ? replacedSnippet.slice(0, -1)
                : replacedSnippet

        const realRange = {
            start: objectRange.start,
            end: {
                line: objectRange.end.line,
                character: objectRange.end.character + 1, // + `.`
            },
        }

        result.add({
            label: selector,
            labelDetails: {
                description: description,
            },
            insertText: "$0",
            insertTextFormat: InsertTextFormat.Snippet,
            kind: CompletionItemKind.Snippet,
            additionalTextEdits: [
                {
                    newText: preparedSnippet,
                    range: realRange,
                },
            ],
            textEditText: preparedSnippet,
            weight: CompletionWeight.SNIPPET,
        })
    }

    private unwrapParens(object: SyntaxNode | null): SyntaxNode | null {
        if (!object) return null
        if (object.type === "parenthesized_expression") {
            return object.children[1] ?? null
        }
        return object
    }
}
