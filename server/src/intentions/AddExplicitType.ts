import {Intention, IntentionContext} from "@server/intentions/Intention"
import {WorkspaceEdit} from "vscode-languageserver"
import {File} from "@server/psi/File"
import {asLspPosition, asParserPoint} from "@server/utils/position"
import {Position} from "vscode-languageclient"
import {VarDeclaration} from "@server/psi/Node"
import {FileDiff} from "@server/utils/FileDiff"

export class AddExplicitType implements Intention {
    id: string = "tact.add-explicit-type"
    name: string = "Add explicit type"

    findVariable(ctx: IntentionContext): VarDeclaration | null {
        const referenceNode = nodeAtPosition(ctx.position, ctx.file)
        if (referenceNode?.type !== "identifier") return null
        const parent = referenceNode.parent
        if (parent?.type !== "let_statement") return null
        return new VarDeclaration(parent, ctx.file)
    }

    is_available(ctx: IntentionContext): boolean {
        const variable = this.findVariable(ctx)
        if (!variable) return false
        return !variable.hasTypeHint()
    }

    invoke(ctx: IntentionContext): WorkspaceEdit | null {
        const variable = this.findVariable(ctx)
        if (!variable) return null
        if (variable.hasTypeHint()) return null

        const name = variable.nameIdentifier()
        if (!name) return null

        const inferredType = variable.value()?.type()
        if (!inferredType) return null

        const diff = FileDiff.forFile(ctx.file.uri)
        diff.appendTo(asLspPosition(name.endPosition), `: ${inferredType.name()}`)

        return diff.toWorkspaceEdit()
    }
}

function nodeAtPosition(pos: Position, file: File) {
    const cursorPosition = asParserPoint(pos)
    return file.rootNode.descendantForPosition(cursorPosition)
}
