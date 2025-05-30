//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import * as lsp from "vscode-languageserver"
import {TactFile} from "@server/languages/tact/psi/TactFile"
import type {Node as SyntaxNode} from "web-tree-sitter"
import {Inspection, InspectionIds} from "./Inspection"
import {asLspPosition, asLspRange} from "@server/utils/position"
import {FileDiff} from "@server/utils/FileDiff"
import {RecursiveVisitor} from "@server/languages/tact/psi/RecursiveVisitor"

export class RewriteAsAugmentedAssignment implements Inspection {
    public readonly id: "rewrite-as-augmented-assignment" =
        InspectionIds.REWRITE_AS_AUGMENTED_ASSIGNMENT

    public inspect(file: TactFile): lsp.Diagnostic[] {
        if (file.fromStdlib) return []

        const diagnostics: lsp.Diagnostic[] = []

        RecursiveVisitor.visit(file.rootNode, node => {
            if (node.type !== "assignment_statement") {
                return
            }

            // some = some + 10
            // ^^^^   ^^^^^^^^^
            // |      |
            // left   right
            const left = this.unwrapParen(node.childForFieldName("left"))
            const rightWrapped = node.childForFieldName("right")
            const right = this.unwrapParen(rightWrapped)
            const assign = node.children.find(it => it?.text === "=")
            if (!left || !right || !assign || !rightWrapped) return

            if (right.type !== "binary_expression") {
                return
            }

            //             operator
            //             |
            // some = some + 10
            //        |      |
            //        |      binRight
            //        binLeft
            const binLeft = this.unwrapParen(right.childForFieldName("left"))
            const binRight = this.unwrapParen(right.childForFieldName("right"))
            const operator = right.childForFieldName("operator")
            if (!binLeft || !binRight || !operator) return

            if (!this.canBeAugmentedAssign(operator)) return

            if (this.isIdenticalNode(left, binLeft)) {
                // some = some + 10
                diagnostics.push({
                    severity: lsp.DiagnosticSeverity.Information,
                    range: asLspRange(node),
                    message: `Can be rewritten as \`${left.text} ${operator.text}= ${binRight.text}\``,
                    source: "tact",
                    data: this.rewriteAssignment(
                        operator.text,
                        rightWrapped,
                        binRight,
                        assign,
                        file,
                    ),
                })
                return
            }

            if (this.isIdenticalNode(left, binRight) && this.isCommutative(operator)) {
                // some = 10 + some
                diagnostics.push({
                    severity: lsp.DiagnosticSeverity.Information,
                    range: asLspRange(node),
                    message: `Can be rewritten as \`${left.text} ${operator.text}= ${binLeft.text}\``,
                    source: "tact",
                    data: this.rewriteAssignment(
                        operator.text,
                        rightWrapped,
                        binLeft,
                        assign,
                        file,
                    ),
                })
            }
        })

        return diagnostics
    }

    private isIdenticalNode(left: SyntaxNode, right: SyntaxNode): boolean {
        return left.text === right.text
    }

    private unwrapParen(node: SyntaxNode | null): SyntaxNode | null {
        if (!node) return node
        if (node.type === "parenthesized_expression") {
            const expr = node.child(1)
            if (!expr) return node
            return expr
        }
        return node
    }

    private canBeAugmentedAssign(node: SyntaxNode): boolean {
        return AUGMENTED_OPS.has(node.text)
    }

    private isCommutative(node: SyntaxNode): boolean {
        return COMMUTATIVE_OPS.has(node.text)
    }

    private rewriteAssignment(
        operator: string,
        afterAssign: SyntaxNode,
        right: SyntaxNode,
        assign: SyntaxNode,
        file: TactFile,
    ): undefined | lsp.CodeAction {
        const diff = FileDiff.forFile(file.uri)

        // add `+` to `=`
        diff.appendTo(asLspPosition(assign.startPosition), operator)
        diff.replace(asLspRange(afterAssign), right.text)

        const edit = diff.toWorkspaceEdit()
        return {
            edit,
            title: `Rewrite with \`${operator}=\` operator`,
            isPreferred: true,
        }
    }
}

const AUGMENTED_OPS: Set<string> = new Set([
    "+",
    "-",
    "*",
    "/",
    "%",
    "&",
    "^",
    "|",
    "&&",
    "||",
    "<<",
    ">>",
])

const COMMUTATIVE_OPS: Set<string> = new Set(["+", "*", "&", "^", "|", "&&", "||"])
