import * as lsp from "vscode-languageserver"
import type {File} from "@server/psi/File"
import {asLspRange} from "@server/utils/position"
import {RecursiveVisitor} from "@server/psi/RecursiveVisitor"
import {Inspection, InspectionIds} from "./Inspection"
import {Node as SyntaxNode} from "web-tree-sitter"
import {FileDiff} from "@server/utils/FileDiff"
import {CallLike} from "@server/psi/Node"
import {toolchain} from "@server/toolchain"

export class RewriteInspection implements Inspection {
    public readonly id: "rewrite" = InspectionIds.REWRITE

    public inspect(file: File): lsp.Diagnostic[] {
        if (!toolchain.isTact16()) return []
        if (file.fromStdlib) return []
        const diagnostics: lsp.Diagnostic[] = []

        RecursiveVisitor.visit(file.rootNode, node => {
            if (this.isContextSender(node)) {
                diagnostics.push({
                    severity: lsp.DiagnosticSeverity.Information,
                    range: asLspRange(node),
                    message: "Can be rewritten as more efficient `sender()`",
                    source: "tact",
                    code: "performance",
                    data: this.rewriteContextSenderAction(node, file),
                })
            }

            const sendFields = this.isSend(node, file)
            if (sendFields && this.canBeRewrittenAsMessage(sendFields)) {
                const name = node.childForFieldName("name")
                if (!name) return

                diagnostics.push({
                    severity: lsp.DiagnosticSeverity.Information,
                    range: asLspRange(name),
                    message:
                        "Can be rewritten as more efficient `message(MessageParameters { ... })`",
                    source: "tact",
                    code: "performance",
                    data: this.rewriteSendWithAction(node, file, "message", "MessageParameters"),
                })
            }

            if (sendFields && this.canBeRewrittenAsDeploy(sendFields)) {
                const name = node.childForFieldName("name")
                if (!name) return

                diagnostics.push({
                    severity: lsp.DiagnosticSeverity.Information,
                    range: asLspRange(name),
                    message:
                        "Can be rewritten as more efficient `deploy(DeployParameters { ... })`",
                    source: "tact",
                    code: "performance",
                    data: this.rewriteSendWithAction(node, file, "deploy", "DeployParameters"),
                })
            }
        })

        return diagnostics
    }

    /**
     * Check for `context().sender`.
     */
    private isContextSender(node: SyntaxNode): boolean {
        if (node.type !== "field_access_expression") return false

        const left = node.childForFieldName("object")
        const right = node.childForFieldName("name")

        if (!left || !right) return false

        if (right.text !== "sender") return false
        if (left.type !== "static_call_expression") return false

        const callName = left.childForFieldName("name")
        return callName?.text === "context"
    }

    private rewriteContextSenderAction(node: SyntaxNode, file: File): lsp.CodeAction {
        const diff = FileDiff.forFile(file.uri)
        diff.replace(asLspRange(node), "sender()")
        const edit = diff.toWorkspaceEdit()
        return {
            edit,
            title: "Rewrite as `sender()`",
            isPreferred: true,
        }
    }

    private canBeRewrittenAsMessage(fields: Map<string, string>): boolean {
        if (fields.has("code") && fields.get("code") !== "null") {
            // MessageParams doesn't have `code` field
            return false
        }
        if (fields.has("data") && fields.get("data") !== "null") {
            // MessageParams doesn't have `data` field
            return false
        }
        // Any `send()` without these fields can be rewritten
        return true
    }

    private canBeRewrittenAsDeploy(fields: Map<string, string>): boolean {
        if (fields.has("to")) {
            // DeployParams doesn't have `to` field
            return false
        }
        // Any `send()` without this field can be rewritten
        return true
    }

    private isSend(node: SyntaxNode, file: File): undefined | Map<string, string> {
        if (node.type !== "static_call_expression") return undefined
        const callName = node.childForFieldName("name")
        if (callName?.text !== "send") return undefined

        const call = new CallLike(node, file)
        const args = call.arguments()
        if (args.length !== 1) return undefined

        const arg = args[0]
        if (arg.type !== "argument") return undefined

        const instanceExpression = arg.firstChild
        if (instanceExpression?.type !== "instance_expression") return undefined

        const name = instanceExpression.childForFieldName("name")
        if (name?.text !== "SendParameters") return undefined

        const instanceArguments = instanceExpression.childForFieldName("arguments")
        if (!instanceArguments) return undefined

        const fields = instanceArguments.children
            .filter(it => it?.type === "instance_argument")
            .filter(it => it !== null)

        const fieldsMap: Map<string, string> = new Map()
        for (const field of fields) {
            const name = field.childForFieldName("name")
            const value = field.childForFieldName("value")

            if (!name) continue

            if (value) {
                fieldsMap.set(name.text, value.text)
            } else {
                // Foo { foo }
                //       ^^^ field name and field initializer
                fieldsMap.set(name.text, name.text)
            }
        }

        return fieldsMap
    }

    private rewriteSendWithAction(
        node: SyntaxNode,
        file: File,
        functionName: string,
        paramsName: string,
    ): undefined | lsp.CodeAction {
        if (node.type !== "static_call_expression") return undefined
        const callName = node.childForFieldName("name")
        if (callName?.text !== "send") return undefined

        const call = new CallLike(node, file)
        const args = call.arguments()
        if (args.length !== 1) return undefined

        const arg = args[0]
        if (arg.type !== "argument") return undefined

        const instanceExpression = arg.firstChild
        if (instanceExpression?.type !== "instance_expression") return undefined

        const name = instanceExpression.childForFieldName("name")
        if (name?.text !== "SendParameters") return undefined

        const diff = FileDiff.forFile(file.uri)
        diff.replace(asLspRange(callName), functionName)
        diff.replace(asLspRange(name), paramsName)

        const edit = diff.toWorkspaceEdit()
        return {
            edit,
            title: `Rewrite as \`${functionName}(${paramsName} { ... })\``,
            isPreferred: true,
        }
    }
}
