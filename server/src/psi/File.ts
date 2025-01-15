import {NamedNode} from "./Node";
import {Constant, Function, Message, Primitive, Struct} from "./TopLevelDeclarations";
import {readFileSync} from "fs";
import {createParser} from "../parser";
import {SyntaxNode, Tree} from "web-tree-sitter";

export class File {
    public constructor(
        public readonly uri: string,
        public readonly tree: Tree,
    ) {
    }

    public get rootNode(): SyntaxNode {
        return this.tree.rootNode
    }

    public get path(): string {
        return this.uri.slice(7);
    }

    public getFunctions(): Function[] {
        return this.getNodesByType(
            ['global_function', 'asm_function'],
            Function
        );
    }

    public getStructs(): Struct[] {
        return this.getNodesByType('struct', Struct);
    }

    public getMessages(): Message[] {
        return this.getNodesByType('message', Message);
    }

    public getPrimitives(): Primitive[] {
        return this.getNodesByType('primitive', Primitive);
    }

    public getConstants(): Constant[] {
        return this.getNodesByType('global_constant', Constant);
    }

    private getNodesByType<T extends NamedNode>(
        nodeType: string | string[],
        constructor: new (node: any, file: File) => T
    ): T[] {
        const tree = this.getTree();
        const types = Array.isArray(nodeType) ? nodeType : [nodeType];

        return tree.rootNode.children
            .filter(node => types.includes(node.type))
            .map(node => new constructor(node, this));
    }

    private getTree() {
        // TODO: just for now
        const content = readFileSync(this.path).toString();
        const parser = createParser()
        return parser.parse(content);
    }
}
