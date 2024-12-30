import {NamedNode, Node} from "./Node";
import {Function, Message, Struct} from "./TopLevelDeclarations";
import {readFileSync} from "fs";
import {createParser} from "../parser";

export class File {
    public readonly path: string;

    public constructor(path: string) {
        this.path = path;
    }

    public get uri(): string {
        return "file://" + this.path;
    }

    public getFunctions(): Function[] {
        const tree = this.getTree();

        const result: Function[] = [];

        for (const node of tree.rootNode.children) {
            if (node.type === 'global_function' || node.type === 'asm_function') {
                result.push(new Function(node, this))
            }
        }

        return result
    }

    public getStructs(): Struct[] {
        const content = readFileSync(this.path).toString();
        const parser = createParser()

        const tree = parser.parse(content);

        const result: Struct[] = [];

        for (const node of tree.rootNode.children) {
            if (node.type === 'struct') {
                result.push(new Struct(node, this))
            }
        }

        return result
    }

    public getMessages(): Message[] {
        const content = readFileSync(this.path).toString();
        const parser = createParser()

        const tree = parser.parse(content);

        const result: Message[] = [];

        for (const node of tree.rootNode.children) {
            if (node.type === 'message') {
                result.push(new Message(node, this))
            }
        }

        return result
    }

    public getPrimitives(): NamedNode[] {
        const content = readFileSync(this.path).toString();
        const parser = createParser()

        const tree = parser.parse(content);

        const result: NamedNode[] = [];

        for (const node of tree.rootNode.children) {
            if (node.type === 'primitive') {
                result.push(new NamedNode(node, this))
            }
        }

        return result
    }

    private getTree() {
        // TODO: just for now
        const content = readFileSync(this.path).toString();
        const parser = createParser()
        return parser.parse(content);
    }
}
