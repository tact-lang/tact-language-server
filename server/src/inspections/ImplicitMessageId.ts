import * as lsp from "vscode-languageserver"
import type {File} from "@server/psi/File"
import {Inspection, InspectionIds} from "./Inspection"
import {asLspPosition, asLspRange} from "@server/utils/position"
import {Message} from "@server/psi/Decls"
import {FileDiff} from "@server/utils/FileDiff"

export class ImplicitMessageId implements Inspection {
    public readonly id: "implicit-message-id" = InspectionIds.IMPLICIT_MESSAGE_ID

    public inspect(file: File): lsp.Diagnostic[] {
        if (file.fromStdlib) return []
        const diagnostics: lsp.Diagnostic[] = []
        this.checkFile(file, diagnostics)
        return diagnostics
    }

    protected checkFile(file: File, diagnostics: lsp.Diagnostic[]): void {
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
                message: `Consider setting the message ID explicitly instead of the implicit ${implicitOpcode}`,
                source: "tact",
                data: this.insertExplicitId(message, implicitOpcode, file),
            })
        }
    }

    private insertExplicitId(
        message: Message,
        opcode: string,
        file: File,
    ): undefined | lsp.CodeAction {
        const messageKeyword = message.node.firstChild
        if (!messageKeyword) return undefined

        const diff = FileDiff.forFile(file.uri)

        diff.appendTo(asLspPosition(messageKeyword.endPosition), `(${opcode})`)

        const edit = diff.toWorkspaceEdit()
        return {
            edit,
            title: `Add explicit message ID: ${opcode}`,
            isPreferred: true,
        }
    }
}
