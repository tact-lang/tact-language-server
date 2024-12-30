import {Tree} from "web-tree-sitter";
import {Node, File} from "../reference";

export enum IndexKey {
    Contracts = 'Contracts',
    Functions = 'Functions',
    Messages = 'Messages',
    Structs = 'Structs',
    Traits = 'Traits',
}

export class FileIndex {
    private readonly elements: Map<IndexKey, Node[]> = new Map()

    public constructor(elements: Map<IndexKey, Node[]>) {
        this.elements = elements
    }

    public static create(path: string, tree: Tree): FileIndex {
        const elements = new Map<IndexKey, Node[]>()
        elements.set(IndexKey.Structs, [])
        elements.set(IndexKey.Traits, [])
        elements.set(IndexKey.Messages, [])
        elements.set(IndexKey.Contracts, [])
        elements.set(IndexKey.Functions, [])

        const file = new File(path)

        for (const node of tree.rootNode.children) {
            if (node.type === 'global_function' || node.type === 'asm_function') {
                elements.get(IndexKey.Functions)!.push(new Node(node, file))
            }
            if (node.type === 'struct') {
                elements.get(IndexKey.Structs)!.push(new Node(node, file))
            }
            if (node.type === 'message') {
                elements.get(IndexKey.Messages)!.push(new Node(node, file))
            }
            if (node.type === 'trait') {
                elements.get(IndexKey.Traits)!.push(new Node(node, file))
            }
            if (node.type === 'contract') {
                elements.get(IndexKey.Contracts)!.push(new Node(node, file))
            }
        }

        return new FileIndex(elements)
    }

    public elementsByKey(key: IndexKey): Node[] {
        return this.elements.get(key) ?? []
    }

    public elementByName(key: IndexKey, name: string): Node | null {
        const elements = this.elements.get(key) ?? []
        const found = elements.find(value => {
            const nameNode = value.node.childForFieldName('name')
            return nameNode?.text === name
        });
        if (!found) return null
        return found
    }
}

export class Index {
    private readonly files: Map<string, FileIndex> = new Map()

    public addFile(path: string, tree: Tree) {
        if (this.files.has(path)) {
            return
        }

        const index = FileIndex.create(path, tree)
        this.files.set(path, index)

        console.log(`added file ${path} to index`)
    }

    public removeFile(path: string) {
        this.files.delete(path)

        console.log(`removed file ${path} to index`)
    }

    public elementsByKey(key: IndexKey): Node[] {
        const result: Node[] = []
        for (const value of this.files.values()) {
            result.push(...value.elementsByKey(key))
        }
        return result
    }

    public elementByName(key: IndexKey, name: string): Node | null {
        for (const value of this.files.values()) {
            const result = value.elementByName(key, name)
            if (result) {
                return result
            }
        }
        return null
    }
}

export const index = new Index()
