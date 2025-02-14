import type {Intention, IntentionContext} from "@server/intentions/Intention"
import type {WorkspaceEdit} from "vscode-languageserver"
import type {File} from "@server/psi/File"
import {asParserPoint} from "@server/utils/position"
import type {Position} from "vscode-languageclient"
import {NamedNode} from "@server/psi/Node"
import {FileDiff} from "@server/utils/FileDiff"
import {Reference} from "@server/psi/Reference"
import {Contract, Primitive} from "@server/psi/Decls"
import type {Node as SyntaxNode} from "web-tree-sitter"

export class AddImport implements Intention {
    public readonly id: string = "tact.add-import"
    public readonly name: string = "Import symbol from other file"

    private static resolveIdentifier(ctx: IntentionContext): NamedNode | null {
        const node = nodeAtPosition(ctx.position, ctx.file)
        if (node?.type !== "identifier" && node?.type !== "type_identifier") return null

        const resolved = Reference.resolve(new NamedNode(node, ctx.file))
        if (!resolved) return null
        if (resolved instanceof Primitive || resolved instanceof Contract) return null

        return resolved
    }

    public isAvailable(ctx: IntentionContext): boolean {
        const resolved = AddImport.resolveIdentifier(ctx)
        if (!resolved) return false
        if (resolved.file.uri === ctx.file.uri) return false

        const importPath = resolved.file.importPath(ctx.file)
        return !ctx.file.alreadyImport(importPath) && !resolved.file.isImportedImplicitly()
    }

    public invoke(ctx: IntentionContext): WorkspaceEdit | null {
        const resolved = AddImport.resolveIdentifier(ctx)
        if (!resolved) return null

        const diff = FileDiff.forFile(ctx.file.uri)

        const positionToInsert = ctx.file.positionForNextImport()
        const importPath = resolved.file.importPath(ctx.file)

        const extraLine = positionToInsert.line === 0 && ctx.file.imports().length === 0 ? "\n" : ""

        diff.appendAsPrevLine(positionToInsert.line, `import "${importPath}";${extraLine}`)

        return diff.toWorkspaceEdit()
    }
}

function nodeAtPosition(pos: Position, file: File): SyntaxNode | null {
    const cursorPosition = asParserPoint(pos)
    return file.rootNode.descendantForPosition(cursorPosition)
}
