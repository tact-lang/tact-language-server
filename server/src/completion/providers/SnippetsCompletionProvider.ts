import {CompletionProvider} from "@server/completion/CompletionProvider"
import {CompletionItemKind, InsertTextFormat} from "vscode-languageserver-types"
import {CompletionContext} from "@server/completion/CompletionContext"
import {CompletionResult, CompletionWeight} from "@server/completion/WeightedCompletionItem"

export class SnippetsCompletionProvider implements CompletionProvider {
    isAvailable(ctx: CompletionContext): boolean {
        return (
            !ctx.isExpression &&
            !ctx.topLevel &&
            !ctx.afterDot &&
            !ctx.topLevelInTraitOrContract &&
            !ctx.topLevelInStructOrMessage &&
            !ctx.inTlbSerialization
        )
    }

    addCompletion(_ctx: CompletionContext, result: CompletionResult): void {
        result.add({
            label: "let",
            kind: CompletionItemKind.Snippet,
            insertTextFormat: InsertTextFormat.Snippet,
            insertText: "let ${1:name} = ${2:value};",
            weight: CompletionWeight.SNIPPET,
        })

        result.add({
            label: "lett",
            kind: CompletionItemKind.Snippet,
            insertTextFormat: InsertTextFormat.Snippet,
            insertText: "let ${1:name}: ${2:Int} = ${3:value};",
            weight: CompletionWeight.SNIPPET,
        })

        result.add({
            label: "if",
            kind: CompletionItemKind.Snippet,
            insertTextFormat: InsertTextFormat.Snippet,
            insertText: "if (${1:condition}) {\n\t${0}\n}",
            weight: CompletionWeight.SNIPPET,
        })

        result.add({
            label: "ife",
            kind: CompletionItemKind.Snippet,
            insertTextFormat: InsertTextFormat.Snippet,
            insertText: "if (${1:condition}) {\n\t${2}\n} else {\n\t${0}\n}",
            weight: CompletionWeight.SNIPPET,
        })

        result.add({
            label: "while",
            kind: CompletionItemKind.Snippet,
            insertTextFormat: InsertTextFormat.Snippet,
            insertText: "while (${1:condition}) {\n\t${0}\n}",
            weight: CompletionWeight.SNIPPET,
        })

        result.add({
            label: "until",
            kind: CompletionItemKind.Snippet,
            insertTextFormat: InsertTextFormat.Snippet,
            insertText: "do {\n\t${0}\n} until (${1:condition});",
            weight: CompletionWeight.SNIPPET,
        })

        result.add({
            label: "repeat",
            kind: CompletionItemKind.Snippet,
            insertTextFormat: InsertTextFormat.Snippet,
            insertText: "repeat(${1:index}) {\n\t${0}\n}",
            weight: CompletionWeight.SNIPPET,
        })

        result.add({
            label: "foreach",
            kind: CompletionItemKind.Snippet,
            insertTextFormat: InsertTextFormat.Snippet,
            insertText: "foreach (${1:key}, ${2:value} in ${3:map}) {\n\t${0}\n}",
            weight: CompletionWeight.SNIPPET,
        })

        result.add({
            label: "try",
            kind: CompletionItemKind.Snippet,
            insertTextFormat: InsertTextFormat.Snippet,
            insertText: "try {\n\t${0}\n}",
            weight: CompletionWeight.SNIPPET,
        })

        result.add({
            label: "try-catch",
            kind: CompletionItemKind.Snippet,
            insertTextFormat: InsertTextFormat.Snippet,
            insertText: "try {\n\t${1}\n} catch (e) {\n\t${2}\n}",
            weight: CompletionWeight.SNIPPET,
        })
    }
}
