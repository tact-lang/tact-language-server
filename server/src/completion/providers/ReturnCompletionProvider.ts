import {CompletionProvider} from "../CompletionProvider"
import {CompletionItem, CompletionItemKind, InsertTextFormat} from "vscode-languageserver-types"
import {CompletionContext} from "../CompletionContext"
import {funNodesTypes, parentOfType} from "../../psi/utils"
import {Fun} from "../../psi/Decls"
import {OptionTy, PrimitiveTy} from "../../types/BaseTy"
import {TypeInferer} from "../../TypeInferer"

export class ReturnCompletionProvider implements CompletionProvider {
    isAvailable(ctx: CompletionContext): boolean {
        return ctx.isStatement
    }

    addCompletion(ctx: CompletionContext, elements: CompletionItem[]): void {
        const outerFunctionNode = parentOfType(ctx.element.node, ...funNodesTypes())
        if (!outerFunctionNode) return
        const outerFunction = new Fun(outerFunctionNode, ctx.element.file)

        const returnTypeExpr = outerFunction.returnType()
        if (!returnTypeExpr) {
            elements.push({
                label: "return;",
                kind: CompletionItemKind.Keyword,
                insertText: "return;",
                insertTextFormat: InsertTextFormat.Snippet,
            })
            return
        }

        const returnType = TypeInferer.inferType(returnTypeExpr)
        if (!returnType) return

        elements.push({
            label: "return <expr>;",
            kind: CompletionItemKind.Keyword,
            insertText: "return $0;",
            insertTextFormat: InsertTextFormat.Snippet,
        })

        if (returnType instanceof PrimitiveTy && returnType.name() === "Bool") {
            elements.push({
                label: "return true;",
                kind: CompletionItemKind.Snippet,
            })

            elements.push({
                label: "return false;",
                kind: CompletionItemKind.Snippet,
            })
        }

        if (returnType instanceof PrimitiveTy && returnType.name() === "Int") {
            elements.push({
                label: "return 0;",
                kind: CompletionItemKind.Snippet,
            })
        }

        if (returnType instanceof PrimitiveTy && returnType.name() === "String") {
            elements.push({
                label: 'return "";',
                kind: CompletionItemKind.Snippet,
            })
        }

        if (returnType instanceof OptionTy) {
            elements.push({
                label: "return null;",
                kind: CompletionItemKind.Snippet,
            })
        }
    }
}
