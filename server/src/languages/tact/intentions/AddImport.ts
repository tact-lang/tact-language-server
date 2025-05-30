//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type {Intention, IntentionContext} from "@server/languages/tact/intentions/Intention"
import type {WorkspaceEdit} from "vscode-languageserver"
import type {TactFile} from "@server/languages/tact/psi/TactFile"
import {asParserPoint} from "@server/utils/position"
import type {Position} from "vscode-languageclient"
import {NamedNode} from "@server/languages/tact/psi/TactNode"
import {FileDiff} from "@server/utils/FileDiff"
import {Primitive} from "@server/languages/tact/psi/Decls"
import type {Node as SyntaxNode} from "web-tree-sitter"
import {index, IndexKey} from "@server/languages/tact/indexes"

export class AddImport implements Intention {
    public readonly id: string = "tact.add-import"
    public readonly name: string = "Import symbol from other file"

    private static resolveIdentifier(ctx: IntentionContext): NamedNode | undefined {
        const node = nodeAtPosition(ctx.position, ctx.file)
        if (node?.type !== "identifier" && node?.type !== "type_identifier") return undefined

        const decl = AddImport.findDeclaration(node.text)
        if (decl instanceof Primitive) return undefined // always from stdlib

        return decl
    }

    public isAvailable(ctx: IntentionContext): boolean {
        const resolved = AddImport.resolveIdentifier(ctx)
        if (!resolved) return false
        if (resolved.file.uri === ctx.file.uri) return false

        const importPath = resolved.file.importPath(ctx.file)
        return (
            !ctx.file.alreadyImport(importPath) &&
            !resolved.file.isImportedImplicitly() &&
            !index.hasSeveralDeclarations(resolved.name())
        )
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

    public static findDeclaration(name: string): NamedNode | undefined {
        return (
            index.elementByName(IndexKey.Structs, name) ??
            index.elementByName(IndexKey.Messages, name) ??
            index.elementByName(IndexKey.Contracts, name) ??
            index.elementByName(IndexKey.Traits, name) ??
            index.elementByName(IndexKey.Constants, name) ??
            index.elementByName(IndexKey.Funs, name) ??
            undefined
        )
    }
}

function nodeAtPosition(pos: Position, file: TactFile): SyntaxNode | null {
    const cursorPosition = asParserPoint(pos)
    return file.rootNode.descendantForPosition(cursorPosition)
}
