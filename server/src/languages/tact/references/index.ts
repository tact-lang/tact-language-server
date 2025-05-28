import type {Node as SyntaxNode} from "web-tree-sitter"
import {TactFile} from "@server/languages/tact/psi/TactFile"
import * as lsp from "vscode-languageserver"
import {Referent} from "@server/languages/tact/psi/Referent"
import {getDocumentSettings} from "@server/settings/settings"
import {asLspRange} from "@server/utils/position"

export async function provideTactReferences(
    referenceNode: SyntaxNode,
    file: TactFile,
): Promise<lsp.Location[] | null> {
    if (
        referenceNode.type !== "identifier" &&
        referenceNode.type !== "type_identifier" &&
        referenceNode.type !== "init"
    ) {
        return []
    }

    const result = new Referent(referenceNode, file).findReferences({
        includeDefinition: false,
    })
    if (result.length === 0) return null

    const settings = await getDocumentSettings(file.uri)
    if (settings.findUsages.scope === "workspace") {
        // filter out references from stdlib
        return result
            .filter(value => !value.file.fromStdlib && !value.file.fromStubs)
            .map(value => ({
                uri: value.file.uri,
                range: asLspRange(value.node),
            }))
    }

    return result.map(value => ({
        uri: value.file.uri,
        range: asLspRange(value.node),
    }))
}
