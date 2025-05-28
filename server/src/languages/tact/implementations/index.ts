import type {Node as SyntaxNode} from "web-tree-sitter"
import {TactFile} from "@server/languages/tact/psi/TactFile"
import * as lsp from "vscode-languageserver"
import {NamedNode} from "@server/languages/tact/psi/TactNode"
import {Reference} from "@server/languages/tact/psi/Reference"
import {Fun, Trait} from "@server/languages/tact/psi/Decls"
import * as search from "@server/languages/tact/search/implementations"
import {asNullableLspRange} from "@server/utils/position"

export function provideTactImplementations(
    elementNode: SyntaxNode,
    file: TactFile,
): lsp.Definition | lsp.LocationLink[] {
    if (
        elementNode.type !== "identifier" &&
        elementNode.type !== "self" &&
        elementNode.type !== "type_identifier"
    ) {
        return []
    }

    const element = NamedNode.create(elementNode, file)
    const res = Reference.resolve(element)
    if (res === null) return []

    if (res instanceof Trait) {
        return search.implementations(res).map(impl => ({
            uri: impl.file.uri,
            range: asNullableLspRange(impl.nameIdentifier()),
        }))
    }

    if (res instanceof Fun) {
        return search.implementationsFun(res).map(impl => ({
            uri: impl.file.uri,
            range: asNullableLspRange(impl.nameIdentifier()),
        }))
    }

    return []
}
