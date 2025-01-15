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

    public static create(file: File): FileIndex {
        const elements = new Map<IndexKey, NamedNode[]>()
        elements.set(IndexKey.Structs, [])
        elements.set(IndexKey.Traits, [])
        elements.set(IndexKey.Messages, [])
        elements.set(IndexKey.Contracts, [])
        elements.set(IndexKey.Functions, [])
        elements.set(IndexKey.Constants, [])

        for (const node of file.rootNode.children) {
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

    public addFile(uri: string, file: File) {
        if (this.files.has(uri)) {
            return
        }

        const index = FileIndex.create(file)
        this.files.set(uri, index)

        console.log(`added ${uri} to index`)
    }

    public removeFile(uri: string) {
        this.files.delete(uri)

        console.log(`removed ${uri} to index`)
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
