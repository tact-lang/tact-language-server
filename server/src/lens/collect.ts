import * as lsp from "vscode-languageserver"
import {File} from "../psi/File"
import {RecursiveVisitor} from "../visitor"
import {SyntaxNode} from "web-tree-sitter"
import {parentOfType} from "../psi/utils"
import {Function, StorageMembersOwner} from "../psi/TopLevelDeclarations"
import {NamedNode} from "../psi/Node"

export function collect(file: File): lsp.CodeLens[] {
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
                        title: "go to parent",
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
            const fun = new Function(n, file)
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
                        title: "go to parent",
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

        return true
    })

    return result
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
