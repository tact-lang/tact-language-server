import {NamedNode} from "../psi/Node"
import {File} from "../psi/File"
import {
    Constant,
    Contract,
    Fun,
    Message,
    Primitive,
    Struct,
    Trait,
} from "../psi/TopLevelDeclarations"
import {isNamedFunNode} from "../psi/utils"
import {ResolveState, ScopeProcessor} from "../psi/Reference"
import {PARSED_FILES_CACHE} from "../server"
import {CACHE} from "../cache"

export interface IndexKeyToType {
    [IndexKey.Contracts]: Contract
    [IndexKey.Funs]: Fun
    [IndexKey.Messages]: Message
    [IndexKey.Structs]: Struct
    [IndexKey.Traits]: Trait
    [IndexKey.Primitives]: Primitive
    [IndexKey.Constants]: Constant
}

export enum IndexKey {
    Contracts = "Contracts",
    Funs = "Funs",
    Messages = "Messages",
    Structs = "Structs",
    Traits = "Traits",
    Primitives = "Primitives",
    Constants = "Constants",
}

export class FileIndex {
    private readonly elements: {
        [IndexKey.Contracts]: Contract[]
        [IndexKey.Funs]: Fun[]
        [IndexKey.Messages]: Message[]
        [IndexKey.Structs]: Struct[]
        [IndexKey.Traits]: Trait[]
        [IndexKey.Primitives]: Primitive[]
        [IndexKey.Constants]: Constant[]
    } = {
        [IndexKey.Contracts]: [],
        [IndexKey.Funs]: [],
        [IndexKey.Messages]: [],
        [IndexKey.Structs]: [],
        [IndexKey.Traits]: [],
        [IndexKey.Primitives]: [],
        [IndexKey.Constants]: [],
    }

    public constructor() {}

    public static create(file: File): FileIndex {
        const index = new FileIndex()

        for (const node of file.rootNode.children) {
            if (isNamedFunNode(node)) {
                index.elements[IndexKey.Funs].push(new Fun(node, file))
            }
            if (node.type === "struct") {
                index.elements[IndexKey.Structs].push(new Struct(node, file))
            }
            if (node.type === "contract") {
                index.elements[IndexKey.Contracts].push(new Contract(node, file))
            }
            if (node.type === "message") {
                index.elements[IndexKey.Messages].push(new Message(node, file))
            }
            if (node.type === "trait") {
                index.elements[IndexKey.Traits].push(new Trait(node, file))
            }
            if (node.type === "primitive") {
                index.elements[IndexKey.Primitives].push(new Primitive(node, file))
            }
            if (node.type === "global_constant") {
                index.elements[IndexKey.Constants].push(new Constant(node, file))
            }
        }

        return index
    }

    public processElementsByKey<K extends IndexKey>(
        key: K,
        processor: ScopeProcessor,
        state: ResolveState,
    ): boolean {
        const elements = this.elements[key]
        for (const node of elements) {
            if (!processor.execute(node, state)) return false
        }
        return true
    }

    public elementByName<K extends IndexKey>(key: K, name: string): IndexKeyToType[K] | null {
        switch (key) {
            case IndexKey.Contracts:
                return this.findElement(this.elements[IndexKey.Contracts], name) as
                    | IndexKeyToType[K]
                    | null
            case IndexKey.Funs:
                return this.findElement(this.elements[IndexKey.Funs], name) as
                    | IndexKeyToType[K]
                    | null
            case IndexKey.Messages:
                return this.findElement(this.elements[IndexKey.Messages], name) as
                    | IndexKeyToType[K]
                    | null
            case IndexKey.Structs:
                return this.findElement(this.elements[IndexKey.Structs], name) as
                    | IndexKeyToType[K]
                    | null
            case IndexKey.Traits:
                return this.findElement(this.elements[IndexKey.Traits], name) as
                    | IndexKeyToType[K]
                    | null
            case IndexKey.Primitives:
                return this.findElement(this.elements[IndexKey.Primitives], name) as
                    | IndexKeyToType[K]
                    | null
            case IndexKey.Constants:
                return this.findElement(this.elements[IndexKey.Constants], name) as
                    | IndexKeyToType[K]
                    | null
            default:
                return null
        }
    }

    private findElement<T extends NamedNode>(elements: T[], name: string): T | null {
        return (
            elements.find(value => {
                const nameNode = value.node.childForFieldName("name")
                return nameNode?.text === name
            }) ?? null
        )
    }
}

export class GlobalIndex {
    private readonly files: Map<string, FileIndex> = new Map()

    public addFile(uri: string, file: File) {
        PARSED_FILES_CACHE.clear()
        CACHE.clear()

        if (this.files.has(uri)) {
            return
        }

        const index = FileIndex.create(file)
        this.files.set(uri, index)

        console.log(`added ${uri} to index`)
    }

    public removeFile(uri: string) {
        PARSED_FILES_CACHE.clear()
        CACHE.clear()

        this.files.delete(uri)

        console.log(`removed ${uri} to index`)
    }

    public processElementsByKey<K extends IndexKey>(
        key: K,
        processor: ScopeProcessor,
        state: ResolveState,
    ): boolean {
        for (const value of this.files.values()) {
            if (!value.processElementsByKey(key, processor, state)) return false
        }
        return true
    }

    public elementByName<K extends IndexKey>(key: K, name: string): IndexKeyToType[K] | null {
        for (const value of this.files.values()) {
            const result = value.elementByName(key, name)
            if (result) {
                return result as IndexKeyToType[K]
            }
        }
        return null
    }
}

export const index = new GlobalIndex()
