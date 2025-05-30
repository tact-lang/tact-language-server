import type {Node as SyntaxNode} from "web-tree-sitter"
import {FuncFile} from "./FuncFile"
import {BaseNode} from "@server/psi/BaseNode"
import type {FuncTy} from "../types/BaseTy"

export class FuncNode extends BaseNode {
    public node: SyntaxNode
    public file: FuncFile

    public constructor(node: SyntaxNode, file: FuncFile) {
        super()
        this.node = node
        this.file = file
    }

    public get text(): string {
        return this.node.text
    }

    public type(): FuncTy | null {
        // Lazy import to avoid circular dependency
        const {FuncTypeInferer} = require("../TypeInferer")
        return FuncTypeInferer.inferType(this)
    }

    public override parentOfType(...types: string[]): SyntaxNode | undefined {
        let current: SyntaxNode | null = this.node.parent
        while (current !== null) {
            if (types.includes(current.type)) {
                return current
            }
            current = current.parent
        }
        return undefined
    }
}

export class FuncNamedNode extends FuncNode {
    public name(): string {
        if (this.node.type === "identifier" || this.node.type === "function_name") {
            return this.node.text
        }

        const nameField = this.node.childForFieldName("name")
        if (nameField) {
            return nameField.text
        }

        return ""
    }

    public nameNode(): SyntaxNode | null {
        if (this.node.type === "identifier" || this.node.type === "function_name") {
            return this.node
        }

        return this.node.childForFieldName("name")
    }
}
