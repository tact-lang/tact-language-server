//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type {Node} from "web-tree-sitter"
import {File} from "@server/psi/File"
import {parentOfType} from "@server/psi/utils"
import {RecursiveVisitor} from "@server/psi/RecursiveVisitor"

export class TlbReference {
    private readonly element: Node
    private readonly file: File

    public static resolve(node: Node | null, file: File): Node | null {
        if (node === null) return null
        return new TlbReference(node, file).resolve()
    }

    public constructor(element: Node, file: File) {
        this.element = element
        this.file = file
    }

    public resolve(): Node | null {
        const result: Node[] = []
        this.processResolveVariants(result)
        if (result.length === 0) return null
        return result[0]
    }

    private processResolveVariants(result: Node[]): boolean {
        const parent = this.element.parent
        if (parent?.type === "combinator") return true

        const name = this.element.text

        if (!this.processBlock(result)) return false

        const combinators = this.file.rootNode.children
            .filter(it => it?.type === "source_element")
            .map(it => it?.firstChild)
            .filter(it => it !== null && it !== undefined)

        for (const decl of combinators) {
            const declName = decl.childForFieldName("combinator")?.childForFieldName("name")
            if (!declName) continue

            if (name === declName.text) {
                result.push(declName)
                return false
            }
        }

        return true
    }

    public processBlock(result: Node[]): boolean {
        const declaration = parentOfType(this.element, "declaration")
        if (!declaration) return true

        const fields = declaration.children
            .filter(it => it?.type === "field")
            .map(it => it?.firstChild)
            .filter(it => it !== null && it !== undefined)

        const name = this.element.text

        for (const field of fields) {
            if (field.type === "field_named") {
                const fieldName = field.childForFieldName("name")
                if (!fieldName) continue

                if (name === fieldName.text) {
                    result.push(fieldName)
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
                result.push(paramNode)
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
