import {NamedNode} from "./Node"
import {
    Constant,
    Contract,
    Function,
    Message,
    Primitive,
    Struct,
    Trait,
} from "./TopLevelDeclarations"
import {SyntaxNode, Tree} from "web-tree-sitter"

export class File {
    public constructor(
        public readonly uri: string,
        public readonly tree: Tree,
    ) {}

    public get rootNode(): SyntaxNode {
        return this.tree.rootNode
    }

    public get path(): string {
        return this.uri.slice(7)
    }

    public getFunctions(): Function[] {
        return this.getNodesByType(["global_function", "asm_function", "native_function"], Function)
    }

    public getContracts(): Contract[] {
        return this.getNodesByType("contract", Contract)
    }

    public getStructs(): Struct[] {
        return this.getNodesByType("struct", Struct)
    }

    public getTraits(): Trait[] {
        return this.getNodesByType("trait", Trait)
    }

    public getMessages(): Message[] {
        return this.getNodesByType("message", Message)
    }

    public getPrimitives(): Primitive[] {
        return this.getNodesByType("primitive", Primitive)
    }

    public getConstants(): Constant[] {
        return this.getNodesByType("global_constant", Constant)
    }

    private getNodesByType<T extends NamedNode>(
        nodeType: string | string[],
        constructor: new (node: any, file: File) => T,
    ): T[] {
        const tree = this.tree
        const types = Array.isArray(nodeType) ? nodeType : [nodeType]

        return tree.rootNode.children
            .filter(node => types.includes(node.type))
            .map(node => new constructor(node, this))
    }
}
