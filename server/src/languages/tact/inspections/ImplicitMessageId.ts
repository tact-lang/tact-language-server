//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import * as lsp from "vscode-languageserver"
import type {TactFile} from "@server/languages/tact/psi/TactFile"
import {Inspection, InspectionIds} from "./Inspection"
import {asLspPosition, asLspRange} from "@server/utils/position"
import {Message} from "@server/languages/tact/psi/Decls"
import {FileDiff} from "@server/utils/FileDiff"

export class ImplicitMessageId implements Inspection {
    public readonly id: "implicit-message-opcode" = InspectionIds.IMPLICIT_MESSAGE_OPCODE

    public inspect(file: TactFile): lsp.Diagnostic[] {
        if (file.fromStdlib) return []
        const diagnostics: lsp.Diagnostic[] = []
        this.checkFile(file, diagnostics)
        return diagnostics
    }

    protected checkFile(file: TactFile, diagnostics: lsp.Diagnostic[]): void {
        if (file.fromStdlib) return

        const messages = file.getMessages()
        for (const message of messages) {
            if (message.explicitOpcode() !== undefined) {
                // message(0x1000) Foo {}
                //        ^^^^^^^^
                continue
            }

            const implicitOpcode = message.opcode()
            if (!implicitOpcode) continue

            const nameNode = message.nameIdentifier()
            if (!nameNode) continue

            diagnostics.push({
                severity: lsp.DiagnosticSeverity.Warning,
                range: asLspRange(nameNode),
                message: `Consider setting the message opcode explicitly instead of the implicit ${implicitOpcode}`,
                source: "tact",
                data: this.insertExplicitId(message, implicitOpcode, file),
            })
        }
    }

    private insertExplicitId(
        message: Message,
        opcode: string,
        file: TactFile,
    ): undefined | lsp.CodeAction {
        const messageKeyword = message.node.firstChild
        if (!messageKeyword) return undefined

        const diff = FileDiff.forFile(file.uri)

        diff.appendTo(asLspPosition(messageKeyword.endPosition), `(${opcode})`)

        const edit = diff.toWorkspaceEdit()
        return {
            edit,
            title: `Add explicit message opcode: ${opcode}`,
            isPreferred: true,
        }
    }
}
