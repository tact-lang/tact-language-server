import * as lsp from "vscode-languageserver"
import {File} from "@server/psi/File"
import {RecursiveVisitor} from "@server/psi/visitor"
import {Node as SyntaxNode} from "web-tree-sitter"
import {isNamedFunNode, parentOfType} from "@server/psi/utils"
import {Fun, StorageMembersOwner, Struct, Trait} from "@server/psi/Decls"
import {NamedNode} from "@server/psi/Node"
import {Referent} from "@server/psi/Referent"
import {asLspRange} from "@server/utils/position"
import * as search from "@server/search/implementations"

export function collect(file: File, enabled: boolean): lsp.CodeLens[] {
    if (file.fromStdlib || !enabled) {
        // we don't need to count usages or show anything for stdlib symbols
        return []
    }

    const result: lsp.CodeLens[] = []

    RecursiveVisitor.visit(file.rootNode, (n): boolean => {
        if (n.type === "storage_variable") {
            const ownerNode = parentOfType(n, "trait", "contract")
            if (!ownerNode) return true

            const field = new NamedNode(n, file)
            const owner = new StorageMembersOwner(ownerNode, file)

            const inheritFields = owner.inheritTraits().flatMap(trait => trait.fields())
            if (inheritFields.length === 0) return true

            const found = inheritFields.find(inheritField => inheritField.name() === field.name())
            if (found) {
                const nodeIdentifier = found.nameIdentifier()
                if (!nodeIdentifier) return true

                result.push(
                    newLens(n, {
                        title: "Go to parent",
                        command: "tact.showParent",
                        arguments: [
                            found.file.uri,
                            {
                                line: nodeIdentifier.startPosition.row,
                                character: nodeIdentifier.startPosition.column,
                            } as lsp.Position,
                        ],
                    }),
                )
            }
        }

        if (n.type === "storage_function") {
            const fun = new Fun(n, file)
            if (!fun.isOverride()) return true

            const ownerNode = parentOfType(n, "trait", "contract")
            if (!ownerNode) return true
            const owner = new StorageMembersOwner(ownerNode, file)

            const inheritMethods = owner.inheritTraits().flatMap(trait => trait.methods())
            if (inheritMethods.length === 0) return true

            const found = inheritMethods.find(inheritMethod => inheritMethod.name() === fun.name())
            if (found) {
                const nodeIdentifier = found.nameIdentifier()
                if (!nodeIdentifier) return true

                result.push(
                    newLens(n, {
                        title: "Go to parent",
                        command: "tact.showParent",
                        arguments: [
                            found.file.uri,
                            {
                                line: nodeIdentifier.startPosition.row,
                                character: nodeIdentifier.startPosition.column,
                            } as lsp.Position,
                        ],
                    }),
                )
            }
        }

        if (n.type === "trait" && n.text !== "trait") {
            const trait = new Trait(n, file)
            const impls = search.implementations(trait)

            result.push(
                newLens(n, {
                    title: `${impls.length} implementation` + (impls.length > 1 ? "s" : ""),
                    command: "tact.showReferences",
                    arguments: [
                        file.uri,
                        {
                            line: n.startPosition.row,
                            character: n.startPosition.column,
                        } as lsp.Position,
                        impls.map(r => {
                            const nameNode = r.nameNode()
                            return {
                                uri: r.file.uri,
                                range: asLspRange(nameNode?.node!),
                            } as lsp.Location
                        }),
                    ],
                }),
            )
        }

        if (
            n.type === "trait" ||
            n.type === "struct" ||
            n.type === "message" ||
            n.type === "global_constant" ||
            n.type === "storage_constant" ||
            isNamedFunNode(n)
        ) {
            usagesLens(n, file, result)
        }

        return true
    })

    return result
}

function usagesLens(n: SyntaxNode, file: File, result: lsp.CodeLens[]) {
    if (file.fromStdlib || !file.fromStdlib) {
        // disabled for now
        return
    }

    const struct = new Struct(n, file)
    const nodeIdentifier = struct.nameIdentifier()
    if (!nodeIdentifier) return
    const references = new Referent(nodeIdentifier, file).findReferences(false, false, false)

    result.push(
        newLens(n, {
            title: `${references.length} usages`,
            command: "tact.showReferences",
            arguments: [
                file.uri,
                {
                    line: nodeIdentifier.startPosition.row,
                    character: nodeIdentifier.startPosition.column,
                } as lsp.Position,
                references.map(r => {
                    return {
                        uri: r.file.uri,
                        range: asLspRange(r.node),
                    } as lsp.Location
                }),
            ],
        }),
    )
}

function newLens(node: SyntaxNode, cmd: lsp.Command): lsp.CodeLens {
    const start = {
        line: node.startPosition.row,
        character: node.startPosition.column,
    } as lsp.Position
    return {
        range: {
            start: start,
            end: start,
        },
        command: cmd,
    }
}
