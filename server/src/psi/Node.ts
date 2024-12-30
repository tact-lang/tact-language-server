import {SyntaxNode} from "web-tree-sitter";
import {File} from "./File";
import {Ty} from "../types/BaseTy";
import {TypeInferer} from "../TypeInferer";

export class Node {
    public node: SyntaxNode
    public file: File

    public constructor(node: SyntaxNode, file: File) {
        this.node = node;
        this.file = file;
    }
}

export class Expression extends Node {
    public type(): Ty | null {
        return TypeInferer.inferType(this)
    }
}

export class NamedNode extends Node {
    public nameIdentifier(): SyntaxNode | null {
        if (this.node.type === 'identifier' || this.node.type === 'type_identifier') {
            return this.node
        }

        if (this.node.type === 'primitive') {
            const nameNode = this.node.childForFieldName('type')
            if (!nameNode) {
                return null
            }
            return nameNode
        }

        const nameNode = this.node.childForFieldName('name')
        if (!nameNode) {
            return null
        }
        return nameNode
    }

    public name(): string {
        const ident = this.nameIdentifier()
        if (ident === null) return ""
        return ident.text
    }
}
