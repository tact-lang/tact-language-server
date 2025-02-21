import type {Intention, IntentionContext} from "@server/intentions/Intention"
import type {WorkspaceEdit} from "vscode-languageserver"
import type {File} from "@server/psi/File"
import {asParserPoint} from "@server/utils/position"
import type {Position} from "vscode-languageclient"
import {FileDiff} from "@server/utils/FileDiff"
import type {Node as SyntaxNode} from "web-tree-sitter"
import {Field, Fun, StorageMembersOwner} from "@server/psi/Decls"

export class ImplementMembers implements Intention {
    public readonly id: string = "tact.implement-members"
    public readonly name: string = "Implement members"

    private static findTarget(ctx: IntentionContext): StorageMembersOwner | null {
        const referenceNode = nodeAtPosition(ctx.position, ctx.file)
        if (referenceNode?.type !== "identifier") return null
        const parent = referenceNode.parent
        if (parent?.type !== "contract" && parent?.type !== "trait") return null
        return new StorageMembersOwner(parent, ctx.file)
    }

    public isAvailable(ctx: IntentionContext): boolean {
        const target = ImplementMembers.findTarget(ctx)
        if (!target) return false
        return target.hasParentTraits()
    }

    public invoke(ctx: IntentionContext): WorkspaceEdit | null {
        const target = ImplementMembers.findTarget(ctx)
        if (!target) return null

        const inheritedTraits = target.inheritTraits()

        const fields = inheritedTraits.flatMap(t => t.ownFields())
        const addedFields: Set<string> = new Set()

        // add already defined fields to avoid duplicates
        for (const ownField of target.ownFields()) {
            addedFields.add(ownField.name())
        }

        const fieldsToAdd: Field[] = []

        for (const field of fields) {
            if (addedFields.has(field.name())) continue
            fieldsToAdd.push(field)
            addedFields.add(field.name())
        }

        const abstractMethods = inheritedTraits.flatMap(t =>
            t.methods().filter(m => m.isAbstract()),
        )
        const addedMethods: Set<string> = new Set()

        // add already defined fields to avoid duplicates
        for (const ownMethod of target.ownMethods()) {
            addedMethods.add(ownMethod.name())
        }

        const methodsToAdd: Fun[] = []

        for (const method of abstractMethods) {
            if (addedMethods.has(method.name())) continue
            methodsToAdd.push(method)
            addedMethods.add(method.name())
        }

        const diff = FileDiff.forFile(ctx.file.uri)

        const fieldsPresentation = fieldsToAdd.map(field => `\t${field.presentation()}`).join("\n")
        const methodsPresentation = methodsToAdd
            .map(method => `\tfun ${method.name()}${method.signaturePresentation()} {}`)
            .join("\n")

        const fieldLine = target.positionForNextField()?.line
        if (fieldLine) {
            diff.appendAsNextLine(fieldLine - 1, fieldsPresentation)
        }

        const methodLine = target.positionForNextMethod()?.line
        if (methodLine) {
            const prefix = fieldsToAdd.length > 0 ? "\n" : ""

            diff.appendAsNextLine(methodLine - 1, prefix + methodsPresentation)
        }

        return diff.toWorkspaceEdit()
    }
}

function nodeAtPosition(pos: Position, file: File): SyntaxNode | null {
    const cursorPosition = asParserPoint(pos)
    return file.rootNode.descendantForPosition(cursorPosition)
}
