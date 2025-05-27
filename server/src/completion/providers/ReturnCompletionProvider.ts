//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type {CompletionProvider} from "@server/completion/CompletionProvider"
import {CompletionItemKind, InsertTextFormat} from "vscode-languageserver-types"
import type {CompletionContext} from "@server/completion/CompletionContext"
import {funNodesTypes, parentOfType} from "@server/psi/utils"
import {Fun} from "@server/psi/Decls"
import {OptionTy, PrimitiveTy} from "@server/types/BaseTy"
import {TypeInferer} from "@server/TypeInferer"
import {CompletionResult, CompletionWeight} from "@server/completion/WeightedCompletionItem"

export class ReturnCompletionProvider implements CompletionProvider {
    public isAvailable(ctx: CompletionContext): boolean {
        return ctx.isStatement
    }

    public addCompletion(ctx: CompletionContext, result: CompletionResult): void {
        const outerFunctionNode = parentOfType(ctx.element.node, ...funNodesTypes()) // TODO: support receivers
        if (!outerFunctionNode) return
        const outerFunction = new Fun(outerFunctionNode, ctx.element.file)

        const returnTypeExpr = outerFunction.returnType()
        if (!returnTypeExpr) {
            result.add({
                label: "return;",
                kind: CompletionItemKind.Keyword,
                insertText: "return;",
                insertTextFormat: InsertTextFormat.Snippet,
                weight: CompletionWeight.KEYWORD,
            })
            return
        }

        const returnType = TypeInferer.inferType(returnTypeExpr)
        if (!returnType) return

        result.add({
            label: "return <expr>;",
            kind: CompletionItemKind.Keyword,
            insertText: "return $0;",
            insertTextFormat: InsertTextFormat.Snippet,
            weight: CompletionWeight.KEYWORD,
        })

        if (returnType instanceof PrimitiveTy && returnType.name() === "Bool") {
            result.add({
                label: "return true;",
                kind: CompletionItemKind.Snippet,
                weight: CompletionWeight.KEYWORD,
            })

            result.add({
                label: "return false;",
                kind: CompletionItemKind.Snippet,
                weight: CompletionWeight.KEYWORD,
            })
        }

        if (returnType instanceof PrimitiveTy && returnType.name() === "Int") {
            result.add({
                label: "return 0;",
                kind: CompletionItemKind.Snippet,
                weight: CompletionWeight.KEYWORD,
            })
        }

        if (returnType instanceof PrimitiveTy && returnType.name() === "String") {
            result.add({
                label: 'return "";',
                kind: CompletionItemKind.Snippet,
                weight: CompletionWeight.KEYWORD,
            })
        }

        if (returnType instanceof OptionTy) {
            result.add({
                label: "return null;",
                kind: CompletionItemKind.Snippet,
                weight: CompletionWeight.KEYWORD,
            })
        }
    }
}
