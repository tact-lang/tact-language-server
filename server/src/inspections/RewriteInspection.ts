//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
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
        if (!toolchain.isTact16() && process.env["TACT_TESTS"] !== "true") return []
        if (file.fromStdlib) return []
        const diagnostics: lsp.Diagnostic[] = []

        RecursiveVisitor.visit(file.rootNode, node => {
            if (this.isContextSender(node)) {
                diagnostics.push({
                    severity: lsp.DiagnosticSeverity.Information,
                    range: asLspRange(node),
                    message: "Can be rewritten as more efficient `sender()` (quickfix available)",
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
                        "Can be rewritten as more efficient `message(MessageParameters { ... })` (quickfix available)",
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
                        "Can be rewritten as more efficient `deploy(DeployParameters { ... })` (quickfix available)",
                    source: "tact",
                    code: "performance",
                    data: this.rewriteSendWithAction(node, file, "deploy", "DeployParameters"),
                })
            }

            const replyArgNode = this.matchSelfReply(node)
            if (replyArgNode) {
                diagnostics.push({
                    severity: lsp.DiagnosticSeverity.Information,
                    range: asLspRange(node),
                    message:
                        "Can be rewritten as more efficient `message(MessageParameters { ... })` (quickfix available)",
                    source: "tact",
                    code: "performance",
                    data: this.rewriteSelfReplyAction(node, replyArgNode, file),
                })
            }

            if (this.isSelfNotifyNull(node)) {
                diagnostics.push({
                    severity: lsp.DiagnosticSeverity.Information,
                    range: asLspRange(node),
                    message:
                        "Can be rewritten as more efficient `cashback(sender())` (quickfix available)",
                    source: "tact",
                    code: "performance",
                    data: this.rewriteSelfNotifyAction(node, file),
                })
            }

            const forwardArgs = this.matchSelfForward(node)
            if (forwardArgs) {
                diagnostics.push({
                    severity: lsp.DiagnosticSeverity.Information,
                    range: asLspRange(node),
                    message:
                        "Can be rewritten as more efficient `send(SendParameters{...})` (quickfix available)",
                    source: "tact",
                    code: "performance",
                    data: this.rewriteSelfForwardAction(node, forwardArgs, file),
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

    private matchSelfReply(node: SyntaxNode): SyntaxNode | undefined {
        if (node.type !== "method_call_expression") return undefined

        // self.reply(null)
        // |    |    |
        // |    |    argsNode
        // |    nameNode
        // objectNode
        const nameNode = node.childForFieldName("name")
        const objectNode = node.childForFieldName("object")
        const argsNode = node.childForFieldName("arguments")

        if (!nameNode || !objectNode || !argsNode) return undefined

        if (nameNode.text !== "reply" || objectNode.type !== "self") {
            return undefined
        }

        const argNodes = argsNode.children.filter(c => c?.type === "argument")
        if (argNodes.length !== 1) {
            return undefined
        }

        return argNodes[0]?.firstChild ?? undefined
    }

    private rewriteSelfReplyAction(
        callNode: SyntaxNode,
        dataArgNode: SyntaxNode,
        file: File,
    ): lsp.CodeAction {
        const diff = FileDiff.forFile(file.uri)
        const dataValue = dataArgNode.text

        const replacement = `message(MessageParameters{
            to: sender(),
            mode: SendRemainingValue | SendIgnoreErrors,
            bounce: true,
            body: ${dataValue},
            value: 0,
        })`

        diff.replace(asLspRange(callNode), replacement)

        const edit = diff.toWorkspaceEdit()

        return {
            edit,
            title: "Rewrite as `message(MessageParameters { ... })`",
            isPreferred: true,
        }
    }

    private isSelfNotifyNull(node: SyntaxNode): boolean {
        if (node.type !== "method_call_expression") return false

        // self.notify(null)
        // |    |     |
        // |    |     argsNode
        // |    nameNode
        // objectNode
        const nameNode = node.childForFieldName("name")
        const objectNode = node.childForFieldName("object")
        const argsNode = node.childForFieldName("arguments")

        if (!nameNode || !objectNode || !argsNode) return false

        if (nameNode.text !== "notify" || objectNode.type !== "self") {
            return false
        }

        const argNodes = argsNode.children.filter(c => c?.type === "argument")
        if (argNodes.length !== 1) {
            return false
        }
        const argValueNode = argNodes[0]?.firstChild
        return argValueNode?.type === "null"
    }

    private rewriteSelfNotifyAction(callNode: SyntaxNode, file: File): lsp.CodeAction {
        const diff = FileDiff.forFile(file.uri)
        const replacement = `cashback(sender())`

        diff.replace(asLspRange(callNode), replacement)
        const edit = diff.toWorkspaceEdit()

        return {
            edit,
            title: "Rewrite as `cashback(sender())`",
            isPreferred: true,
        }
    }

    private matchSelfForward(
        node: SyntaxNode,
    ): [SyntaxNode, SyntaxNode, SyntaxNode, SyntaxNode] | undefined {
        if (node.type !== "method_call_expression") return undefined

        // self.forward(sender(), null, false, initOf Proposal())
        // |    |      |
        // |    |      argsNode
        // |    nameNode
        // objectNode
        const nameNode = node.childForFieldName("name")
        const objectNode = node.childForFieldName("object")
        const argsNode = node.childForFieldName("arguments")

        if (!nameNode || !objectNode || !argsNode) return undefined

        if (nameNode.text !== "forward" || objectNode.type !== "self") {
            return undefined
        }

        const argNodes = argsNode.children.filter(c => c?.type === "argument")
        if (argNodes.length !== 4) {
            return undefined
        }

        const arg1 = argNodes[0]?.firstChild
        const arg2 = argNodes[1]?.firstChild
        const arg3 = argNodes[2]?.firstChild
        const arg4 = argNodes[3]?.firstChild

        if (!arg1 || !arg2 || !arg3 || !arg4) return undefined

        return [arg1, arg2, arg3, arg4]
    }

    private rewriteSelfForwardAction(
        callNode: SyntaxNode,
        [to, body, bounced, initOf]: [SyntaxNode, SyntaxNode, SyntaxNode, SyntaxNode],
        file: File,
    ): lsp.CodeAction {
        const diff = FileDiff.forFile(file.uri)
        const tempVarName = "initState"

        const replacement = `let ${tempVarName} = ${initOf.text};
        send(SendParameters{
            to: ${to.text},
            mode: SendRemainingValue | SendIgnoreErrors,
            bounce: ${bounced.text},
            value: 0,
            code: ${tempVarName}.code,
            data: ${tempVarName}.data,
            body: ${body.text}
        })`

        diff.replace(asLspRange(callNode), replacement)

        const edit = diff.toWorkspaceEdit()

        return {
            edit,
            title: "Rewrite as explicit `send(SendParameters{...})`",
            isPreferred: true,
        }
    }
}
