import type {Intention, IntentionContext} from "@server/intentions/Intention"
import type {WorkspaceEdit} from "vscode-languageserver"
import type {File} from "@server/psi/File"
import {asLspPosition, asParserPoint} from "@server/utils/position"
import type {Position} from "vscode-languageclient"
import {VarDeclaration} from "@server/psi/Node"
import {FileDiff} from "@server/utils/FileDiff"
import type {Node as SyntaxNode} from "web-tree-sitter"

export class AddExplicitType implements Intention {
    public readonly id: string = "tact.add-explicit-type"
    public readonly name: string = "Add explicit type"

    private static findVariable(ctx: IntentionContext): VarDeclaration | null {
        const referenceNode = nodeAtPosition(ctx.position, ctx.file)
        if (referenceNode?.type !== "identifier") return null
        const parent = referenceNode.parent
        if (parent?.type !== "let_statement") return null
        return new VarDeclaration(parent, ctx.file)
    }

    public isAvailable(ctx: IntentionContext): boolean {
        const variable = AddExplicitType.findVariable(ctx)
        if (!variable) return false
        return !variable.hasTypeHint()
    }

    public invoke(ctx: IntentionContext): WorkspaceEdit | null {
        const variable = AddExplicitType.findVariable(ctx)
        if (!variable) return null
        if (variable.hasTypeHint()) return null

        const name = variable.nameIdentifier()
        if (!name) return null

        const inferredType = variable.value()?.type()
        if (!inferredType) return null

        const diff = FileDiff.forFile(ctx.file.uri)
        diff.appendTo(asLspPosition(name.endPosition), `: ${inferredType.qualifiedName()}`)

        return diff.toWorkspaceEdit()
    }
}

function nodeAtPosition(pos: Position, file: File): SyntaxNode | null {
    const cursorPosition = asParserPoint(pos)
    return file.rootNode.descendantForPosition(cursorPosition)
}
