import type {Node as SyntaxNode} from "web-tree-sitter"
import {TactFile} from "@server/languages/tact/psi/TactFile"
import * as lsp from "vscode-languageserver"
import {ImportResolver} from "@server/languages/tact/psi/ImportResolver"
import {asLspRange} from "@server/utils/position"
import {filePathToUri} from "@server/files"
import {Reference} from "@server/languages/tact/psi/Reference"
import {Expression, NamedNode} from "@server/languages/tact/psi/TactNode"
import {TypeInferer} from "@server/languages/tact/TypeInferer"
import {BaseTy} from "@server/languages/tact/types/BaseTy"

export function provideTactDefinition(
    hoverNode: SyntaxNode,
    file: TactFile,
): lsp.Location[] | lsp.LocationLink[] {
    if (hoverNode.type === "string" && hoverNode.parent?.type === "import") {
        const importedFile = ImportResolver.resolveNode(file, hoverNode)
        if (!importedFile) return []

        const startOfFile = {
            start: {line: 0, character: 0},
            end: {line: 0, character: 0},
        }

        const hoverRange = asLspRange(hoverNode)
        return [
            {
                targetUri: filePathToUri(importedFile),
                targetRange: startOfFile,
                targetSelectionRange: startOfFile,
                originSelectionRange: {
                    start: {
                        line: hoverRange.start.line,
                        character: hoverRange.start.character + 1,
                    },
                    end: {
                        line: hoverRange.end.line,
                        character: hoverRange.end.character - 1,
                    },
                },
            } as lsp.LocationLink,
        ]
    }

    // resolve `initOf Foo()`
    //          ^^^^^^ this
    // to `init` function of the contract or contract name
    if (hoverNode.type === "initOf") {
        const resolved = Reference.resolveInitOf(hoverNode, file)
        if (!resolved) return []

        return [
            {
                uri: resolved.file.uri,
                range: asLspRange(resolved.node),
            },
        ]
    }

    if (
        hoverNode.type !== "identifier" &&
        hoverNode.type !== "self" &&
        hoverNode.type !== "type_identifier"
    ) {
        return []
    }

    const element = NamedNode.create(hoverNode, file)
    const res = Reference.resolve(element)
    if (res === null) {
        console.warn(`Cannot find definition for: ${hoverNode.text}`)
        return []
    }

    const ident = res.nameIdentifier()
    if (ident === null) return []

    return [
        {
            uri: res.file.uri,
            range: asLspRange(ident),
        },
    ]
}

export function provideTactTypeDefinition(
    hoverNode: SyntaxNode,
    file: TactFile,
): lsp.Definition | lsp.DefinitionLink[] {
    if (
        hoverNode.type !== "identifier" &&
        hoverNode.type !== "self" &&
        hoverNode.type !== "type_identifier"
    ) {
        return []
    }

    const type = TypeInferer.inferType(new Expression(hoverNode, file))
    if (type === null) {
        console.error(`Cannot infer type for Go to Type Definition for: ${hoverNode.text}`)
        return []
    }
    if (!(type instanceof BaseTy)) return []

    const anchor = type.anchor as NamedNode
    const name = anchor.nameIdentifier()
    if (name === null) return []

    return [
        {
            uri: anchor.file.uri,
            range: asLspRange(name),
        },
    ]
}
