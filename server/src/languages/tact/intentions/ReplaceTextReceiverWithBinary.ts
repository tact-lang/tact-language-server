//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type {Intention, IntentionContext} from "@server/languages/tact/intentions/Intention"
import type {WorkspaceEdit} from "vscode-languageserver"
import type {File} from "@server/languages/tact/psi/File"
import {asLspRange, asParserPoint} from "@server/utils/position"
import type {Position} from "vscode-languageclient"
import {FileDiff} from "@server/utils/FileDiff"
import type {Node as SyntaxNode} from "web-tree-sitter"
import {parentOfType} from "@server/languages/tact/psi/utils"
import {toPascalCase} from "@server/utils/strings"
import {index, IndexKey} from "@server/languages/tact/indexes"

export class ReplaceTextReceiverWithBinary implements Intention {
    public readonly id: string = "tact.replace-text-receiver-with-binary"
    public readonly name: string = "Replace text receiver with binary"

    private static resolveString(ctx: IntentionContext): SyntaxNode | null {
        const node = nodeAtPosition(ctx.position, ctx.file)
        if (node?.type !== "string") return null

        const parent = node.parent
        if (!parent) return null
        if (parent.type !== "receive_function" && parent.type !== "external_function") {
            return null
        }
        return node
    }

    public isAvailable(ctx: IntentionContext): boolean {
        return ReplaceTextReceiverWithBinary.resolveString(ctx) !== null
    }

    public invoke(ctx: IntentionContext): WorkspaceEdit | null {
        const resolved = ReplaceTextReceiverWithBinary.resolveString(ctx)
        if (!resolved) return null

        const owner = parentOfType(resolved, "contract", "trait")
        if (!owner) return null

        const diff = FileDiff.forFile(ctx.file.uri)

        const positionToInsert = Math.max(owner.startPosition.row - 1, 0)

        const messageName = this.generateMessageName(resolved)

        const beforeSpace = positionToInsert === 0 ? "" : "\n"
        const afterSpace = positionToInsert === 0 ? "\n" : ""

        diff.appendAsPrevLine(
            positionToInsert,
            `${beforeSpace}message ${messageName} {}${afterSpace}`,
        )
        diff.replace(asLspRange(resolved), `_: ${messageName}`)

        return diff.toWorkspaceEdit()
    }

    private generateMessageName(stringNode: SyntaxNode): string {
        const textReceiver = stringNode.text.slice(1, -1)
        const messageName = toPascalCase(textReceiver)

        const alreadyDefined = index.elementByName(IndexKey.Messages, messageName)
        return alreadyDefined ? messageName + "2" : messageName
    }
}

function nodeAtPosition(pos: Position, file: File): SyntaxNode | null {
    const cursorPosition = asParserPoint(pos)
    return file.rootNode.descendantForPosition(cursorPosition)
}
