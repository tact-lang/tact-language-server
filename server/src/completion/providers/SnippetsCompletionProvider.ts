import {CompletionProvider} from "@server/completion/CompletionProvider"
import {CompletionItem, CompletionItemKind, InsertTextFormat} from "vscode-languageserver-types"
import {CompletionContext} from "@server/completion/CompletionContext"

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

    addCompletion(_ctx: CompletionContext, elements: CompletionItem[]): void {
        elements.push({
            label: "let",
            kind: CompletionItemKind.Snippet,
            insertTextFormat: InsertTextFormat.Snippet,
            insertText: "let ${1:name} = ${2:value};",
        })

        elements.push({
            label: "lett",
            kind: CompletionItemKind.Snippet,
            insertTextFormat: InsertTextFormat.Snippet,
            insertText: "let ${1:name}: ${2:Int} = ${3:value};",
        })

        elements.push({
            label: "if",
            kind: CompletionItemKind.Snippet,
            insertTextFormat: InsertTextFormat.Snippet,
            insertText: "if (${1:condition}) {\n\t${0}\n}",
        })

        elements.push({
            label: "ife",
            kind: CompletionItemKind.Snippet,
            insertTextFormat: InsertTextFormat.Snippet,
            insertText: "if (${1:condition}) {\n\t${2}\n} else {\n\t${0}\n}",
        })

        elements.push({
            label: "while",
            kind: CompletionItemKind.Snippet,
            insertTextFormat: InsertTextFormat.Snippet,
            insertText: "while (${1:condition}) {\n\t${0}\n}",
        })

        elements.push({
            label: "until",
            kind: CompletionItemKind.Snippet,
            insertTextFormat: InsertTextFormat.Snippet,
            insertText: "do {\n\t${0}\n} until (${1:condition});",
        })

        elements.push({
            label: "repeat",
            kind: CompletionItemKind.Snippet,
            insertTextFormat: InsertTextFormat.Snippet,
            insertText: "repeat(${1:index}) {\n\t${0}\n}",
        })

        elements.push({
            label: "foreach",
            kind: CompletionItemKind.Snippet,
            insertTextFormat: InsertTextFormat.Snippet,
            insertText: "foreach (${1:key}, ${2:value} in ${3:map}) {\n\t${0}\n}",
        })

        elements.push({
            label: "try",
            kind: CompletionItemKind.Snippet,
            insertTextFormat: InsertTextFormat.Snippet,
            insertText: "try {\n\t${0}\n}",
        })

        elements.push({
            label: "try-catch",
            kind: CompletionItemKind.Snippet,
            insertTextFormat: InsertTextFormat.Snippet,
            insertText: "try {\n\t${1}\n} catch (e) {\n\t${2}\n}",
        })
    }
}
