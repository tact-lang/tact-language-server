//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type {Node} from "web-tree-sitter"
import {RecursiveVisitor} from "@server/languages/tact/psi/RecursiveVisitor"
import {TlbNode} from "@server/languages/tlb/psi/TlbNode"
import {TlbFile} from "@server/languages/tlb/psi/TlbFile"

export class TlbReference {
    private readonly element: TlbNode
    private readonly file: TlbFile

    public static resolve(node: TlbNode | null): TlbNode | null {
        if (node === null) return null
        return new TlbReference(node, node.file).resolve()
    }

    public constructor(element: TlbNode, file: TlbFile) {
        this.element = element
        this.file = file
    }

    public resolve(): TlbNode | null {
        const result: TlbNode[] = []
        this.processResolveVariants(result)
        if (result.length === 0) return null
        return result[0]
    }

    private processResolveVariants(result: TlbNode[]): boolean {
        const parent = this.element.node.parent
        if (parent?.type === "combinator") return true

        const name = this.element.node.text

        if (!this.processBlock(result)) return false

        const combinators = this.file.rootNode.children
            .filter(it => it?.type === "source_element")
            .map(it => it?.firstChild)
            .filter(it => it !== null && it !== undefined)

        for (const decl of combinators) {
            const declName = decl.childForFieldName("combinator")?.childForFieldName("name")
            if (!declName) continue

            if (name === declName.text) {
                result.push(new TlbNode(declName, this.file))
                return false
            }
        }

        return true
    }

    public processBlock(result: TlbNode[]): boolean {
        const declaration = this.element.parentOfType("declaration")
        if (!declaration) return true

        const fields = declaration.children
            .filter(it => it?.type === "field")
            .map(it => it?.firstChild)
            .filter(it => it !== null && it !== undefined)

        const name = this.element.node.text

        for (const field of fields) {
            if (field.type === "field_named") {
                const fieldName = field.childForFieldName("name")
                if (!fieldName) continue

                if (name === fieldName.text) {
                    result.push(new TlbNode(fieldName, this.file))
                    return false
                }
            }
        }

        const combinator = declaration.childForFieldName("combinator")
        const typeParams =
            combinator?.childForFieldName("type_params")?.children.filter(it => it !== null) ?? []

        for (const param of typeParams) {
            const paramNode = TlbReference.findTypeParameterNode(param)
            if (!paramNode) continue

            if (name === paramNode.text) {
                result.push(new TlbNode(paramNode, this.file))
                return false
            }
        }

        return true
    }

    public static findTypeParameterNode(param: Node): Node | undefined {
        let paramNode: Node | undefined = undefined

        RecursiveVisitor.visit(param, n => {
            if (n.type === "type_identifier") {
                paramNode = n
            }
            return true
        })

        return paramNode
    }
}
