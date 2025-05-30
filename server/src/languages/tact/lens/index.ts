//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import * as lsp from "vscode-languageserver"
import {TactFile} from "@server/languages/tact/psi/TactFile"
import {RecursiveVisitor} from "@server/languages/tact/psi/visitor"
import type {Node as SyntaxNode} from "web-tree-sitter"
import {isNamedFunNode, isReceiveFunNode, parentOfType} from "@server/languages/tact/psi/utils"
import {Fun, Message, StorageMembersOwner, Struct, Trait} from "@server/languages/tact/psi/Decls"
import {CallLike, NamedNode, TactNode} from "@server/languages/tact/psi/TactNode"
import {Referent} from "@server/languages/tact/psi/Referent"
import {asLspRange, asNullableLspRange} from "@server/utils/position"
import * as search from "@server/languages/tact/search/implementations"
import {TactSettings} from "@server/settings/settings"

export function collectTactCodeLenses(
    file: TactFile,
    settings: TactSettings["codeLens"],
): lsp.CodeLens[] {
    if (file.fromStdlib || !settings.enabled) {
        // we don't need to count usages or show anything for stdlib symbols
        return []
    }

    const result: lsp.CodeLens[] = []

    RecursiveVisitor.visit(file.rootNode, (n): boolean => {
        if (n.type === "storage_variable" && settings.showParentTraitFields) {
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

        if (n.type === "storage_function" && settings.showFunctionImplementations) {
            const fun = new Fun(n, file)
            if (fun.isAbstract()) {
                const impls = search.implementationsFun(fun)

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
                                    range: asNullableLspRange(nameNode?.node),
                                } as lsp.Location
                            }),
                        ],
                    }),
                )
            }
        }

        if (n.type === "storage_function" && settings.showOverrides) {
            const fun = new Fun(n, file)
            if (fun.isVirtual()) {
                const impls = search.implementationsFun(fun)

                if (impls.length > 0) {
                    result.push(
                        newLens(n, {
                            title: `${impls.length} override` + (impls.length > 1 ? "s" : ""),
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
                                        range: asNullableLspRange(nameNode?.node),
                                    } as lsp.Location
                                }),
                            ],
                        }),
                    )
                }
            }
        }

        if (n.type === "storage_function" && settings.showParentTraitFunctions) {
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

        if (n.type === "trait" && n.text !== "trait" && settings.showTraitImplementations) {
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
                                range: asNullableLspRange(nameNode?.node),
                            } as lsp.Location
                        }),
                    ],
                }),
            )
        }

        if (n.type === "message") {
            messageReceiversLens(n, file, result, settings)
        }

        if (
            settings.showUsages &&
            (n.type === "trait" ||
                n.type === "struct" ||
                n.type === "message" ||
                n.type === "global_constant" ||
                n.type === "storage_constant" ||
                isNamedFunNode(n))
        ) {
            usagesLens(n, file, result)
        }

        return true
    })

    return result
}

function usagesLens(n: SyntaxNode, file: TactFile, result: lsp.CodeLens[]): void {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (file.fromStdlib || !file.fromStdlib) {
        // disabled for now
        return
    }

    const struct = new Struct(n, file)
    const name = struct.nameIdentifier()
    if (!name) return
    const references = new Referent(name, file).findReferences({
        includeDefinition: false,
        sameFileOnly: false,
        includeSelf: false,
    })

    result.push(referencesLens(`${references.length} usages`, struct, references, name))
}

function messageReceiversLens(
    n: SyntaxNode,
    file: TactFile,
    result: lsp.CodeLens[],
    settings: TactSettings["codeLens"],
): void {
    const message = new Message(n, file)
    const name = message.nameIdentifier()
    if (!name) return

    const references = new Referent(name, file).findReferences({
        includeDefinition: false,
        sameFileOnly: false,
        includeSelf: false,
    })

    const receives = references.filter(it => isReceiveReference(it))
    const sends = references.filter(it => isSendReference(it))

    if (settings.showMessageReceivedCount) {
        const msg = `Received ${receives.length} time${receives.length === 1 ? "" : "s"}`
        result.push(referencesLens(msg, message, receives, name))
    }

    if (settings.showMessageSentCount) {
        const msg = `Sent ${sends.length} time${sends.length === 1 ? "" : "s"}`
        result.push(referencesLens(msg, message, sends, name))
    }
}

function isReceiveReference(node: TactNode): boolean {
    // check if `receive(msg: Foo) {}`
    //                        ^^^ node
    const parent = node.node.parent
    if (parent?.type !== "parameter") return false
    const grand = parent.parent
    if (!grand) return false
    return isReceiveFunNode(grand)
}

function isSendReference(node: TactNode): boolean {
    // check if `Foo {}.toCell()`
    //           ^^^ node
    const grand = node.node.parent?.parent
    if (grand?.type !== "method_call_expression") return false
    const call = new CallLike(grand, node.file)
    return call.name() === "toCell"
}

function referencesLens(
    title: string,
    node: TactNode,
    references: TactNode[],
    ident: SyntaxNode,
): lsp.CodeLens {
    return newLens(node.node, {
        title: title,
        command: "tact.showReferences",
        arguments: [
            node.file.uri,
            {
                line: ident.startPosition.row,
                character: ident.startPosition.column,
            } as lsp.Position,
            references.map(r => {
                return {
                    uri: r.file.uri,
                    range: asLspRange(r.node),
                } as lsp.Location
            }),
        ],
    })
}

function newLens(node: SyntaxNode, cmd: lsp.Command): lsp.CodeLens {
    const start: lsp.Position = {
        line: node.startPosition.row,
        character: node.startPosition.column,
    }
    return {
        range: {
            start: start,
            end: start,
        },
        command: cmd,
    }
}
