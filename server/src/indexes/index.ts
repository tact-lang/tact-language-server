import {Tree} from "web-tree-sitter";
import {NamedNode} from "../psi/Node";
import {File} from "../psi/File";
import {Constant, Function, Message, Struct} from "../psi/TopLevelDeclarations";

export enum IndexKey {
    Contracts = 'Contracts',
    Functions = 'Functions',
    Messages = 'Messages',
    Structs = 'Structs',
    Traits = 'Traits',
    Constants = 'Constants',
}

export class FileIndex {
    private readonly elements: Map<IndexKey, NamedNode[]> = new Map()

    public constructor(elements: Map<IndexKey, NamedNode[]>) {
        this.elements = elements
    }

    public static create(path: string, tree: Tree): FileIndex {
        const elements = new Map<IndexKey, NamedNode[]>()
        elements.set(IndexKey.Structs, [])
        elements.set(IndexKey.Traits, [])
        elements.set(IndexKey.Messages, [])
        elements.set(IndexKey.Contracts, [])
        elements.set(IndexKey.Functions, [])
        elements.set(IndexKey.Constants, [])

        const file = new File(path)

        for (const node of tree.rootNode.children) {
            if (node.type === 'global_function' || node.type === 'asm_function') {
                elements.get(IndexKey.Functions)!.push(new Function(node, file))
            }
            if (node.type === 'struct') {
                elements.get(IndexKey.Structs)!.push(new Struct(node, file))
            }
            if (node.type === 'message') {
                elements.get(IndexKey.Messages)!.push(new Message(node, file))
            }
            if (node.type === 'trait') {
                elements.get(IndexKey.Traits)!.push(new NamedNode(node, file))
            }
            if (node.type === 'contract') {
                elements.get(IndexKey.Contracts)!.push(new NamedNode(node, file))
            }
            if (node.type === 'global_constant') {
                elements.get(IndexKey.Constants)!.push(new Constant(node, file))
            }
        }

        return new FileIndex(elements)
    }

    public elementsByKey(key: IndexKey): NamedNode[] {
        return this.elements.get(key) ?? []
    }

    public elementByName(key: IndexKey, name: string): NamedNode | null {
        const elements = this.elements.get(key) ?? []
        return elements.find(value => {
            const nameNode = value.node.childForFieldName('name')
            return nameNode?.text === name
        }) ?? null
    }
}

export class GlobalIndex {
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

    public elementsByKey(key: IndexKey): NamedNode[] {
        const result: NamedNode[] = []
        for (const value of this.files.values()) {
            result.push(...value.elementsByKey(key))
        }
        return result
    }

    public elementByName(key: IndexKey, name: string): NamedNode | null {
        for (const value of this.files.values()) {
            const result = value.elementByName(key, name)
            if (result) {
                return result
            }
        }
        return null
    }
}

export const index = new GlobalIndex()
