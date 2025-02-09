import {Node as SyntaxNode} from "web-tree-sitter"
import {File} from "./File"
import {Ty} from "@server/types/BaseTy"
import {TypeInferer} from "@server/TypeInferer"
import {Range} from "vscode-languageserver-textdocument"

export class Node {
    public node: SyntaxNode
    public file: File

    public constructor(node: SyntaxNode, file: File) {
        this.node = node
        this.file = file
    }
}

export class Expression extends Node {
    public type(): Ty | null {
        return TypeInferer.inferType(this)
    }
}

export class NamedNode extends Node {
    public static create(node: SyntaxNode, file: File): NamedNode {
        return new NamedNode(node, file)
    }

    public nameIdentifier(): SyntaxNode | null {
        if (
            this.node.type === "identifier" ||
            this.node.type === "self" ||
            this.node.type === "type_identifier"
        ) {
            return this.node
        }

        if (this.node.type === "primitive") {
            const nameNode = this.node.childForFieldName("type")
            if (!nameNode) {
                return null
            }
            return nameNode
        }

        const nameNode = this.node.childForFieldName("name")
        if (!nameNode) {
            return null
        }
        return nameNode
    }

    public nameNode(): NamedNode | null {
        const node = this.nameIdentifier()
        if (!node) return null
        return new NamedNode(node, this.file)
    }

    public name(): string {
        const ident = this.nameIdentifier()
        if (ident === null) return ""
        return ident.text
    }

    public defaultValue(): Expression | null {
        const valueNode = this.node.childForFieldName("value")
        if (valueNode === null) return null
        return new Expression(valueNode, this.file)
    }

    public defaultValueRange(): Range | null {
        const valueNode = this.node.childForFieldName("value")
        if (valueNode === null) return null
        const typeNode = this.node.childForFieldName("type")
        if (typeNode === null) return null

        return {
            start: {
                line: typeNode.endPosition.row,
                character: typeNode.endPosition.column,
            },
            end: {
                line: valueNode.endPosition.row,
                character: valueNode.endPosition.column,
            },
        }
    }
}

export class VarDeclaration extends NamedNode {
    public typeHint(): Expression | null {
        const node = this.node.childForFieldName("type")
        if (!node) return null
        return new Expression(node, this.file)
    }

    public hasTypeHint(): boolean {
        const node = this.node.childForFieldName("type")
        return node !== null
    }

    public value(): Expression | null {
        const node = this.node.childForFieldName("value")
        if (!node) return null
        return new Expression(node, this.file)
    }

    public type(): Ty | null {
        const hint = this.typeHint()
        if (hint !== null) {
            return hint.type()
        }

        const value = this.value()
        if (value !== null) {
            return value.type()
        }

        return null
    }
}

export class CallLike extends NamedNode {
    public rawArguments(): SyntaxNode[] {
        const node = this.node.childForFieldName("arguments")
        if (!node) return []
        return node.children.filter(it => it !== null)
    }
}
