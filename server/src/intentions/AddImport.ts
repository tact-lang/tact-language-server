import {Intention, IntentionContext} from "@server/intentions/Intention"
import {WorkspaceEdit} from "vscode-languageserver"
import {File} from "@server/psi/File"
import {asParserPoint} from "@server/utils/position"
import {Position} from "vscode-languageclient"
import {NamedNode} from "@server/psi/Node"
import {FileDiff} from "@server/utils/FileDiff"
import {Reference} from "@server/psi/Reference"
import {Contract, Primitive} from "@server/psi/Decls"

export class AddImport implements Intention {
    id: string = "tact.add-import"
    name: string = "Import symbol from other file"

    resolveIdentifier(ctx: IntentionContext): NamedNode | null {
        const node = nodeAtPosition(ctx.position, ctx.file)
        if (node?.type !== "identifier" && node?.type !== "type_identifier") return null

        const resolved = Reference.resolve(new NamedNode(node, ctx.file))
        if (!resolved) return null
        if (resolved instanceof Primitive || resolved instanceof Contract) return null

        return resolved
    }

    is_available(ctx: IntentionContext): boolean {
        const resolved = this.resolveIdentifier(ctx)
        if (!resolved) return false
        if (resolved.file.uri === ctx.file.uri) return false

        const importPath = resolved.file.importPath(ctx.file)
        return !ctx.file.alreadyImport(importPath) && !resolved.file.isImportedImplicitly()
    }

    invoke(ctx: IntentionContext): WorkspaceEdit | null {
        const resolved = this.resolveIdentifier(ctx)
        if (!resolved) return null

        const diff = FileDiff.forFile(ctx.file.uri)

        const positionToInsert = ctx.file.positionForNextImport()
        const importPath = resolved.file.importPath(ctx.file)

        const extraLine = positionToInsert.line === 0 && ctx.file.imports().length === 0 ? "\n" : ""

        diff.appendAsPrevLine(positionToInsert.line, `import "${importPath}";${extraLine}`)

        return diff.toWorkspaceEdit()
    }
}

function nodeAtPosition(pos: Position, file: File) {
    const cursorPosition = asParserPoint(pos)
    return file.rootNode.descendantForPosition(cursorPosition)
}
