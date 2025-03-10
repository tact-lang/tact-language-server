import {NamedNode} from "@server/psi/Node"
import {File} from "@server/psi/File"
import {Constant, Contract, Fun, Message, Primitive, Struct, Trait} from "@server/psi/Decls"
import {isNamedFunNode} from "@server/psi/utils"
import {ResolveState, ScopeProcessor} from "@server/psi/Reference"
import {CACHE} from "@server/cache"
import {PARSED_FILES_CACHE} from "@server/indexing-root"

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

    public static create(file: File): FileIndex {
        const index = new FileIndex()

        for (const node of file.rootNode.children) {
            if (!node) continue

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

    public processElementsByKey(
        key: IndexKey,
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
            case IndexKey.Contracts: {
                return this.findElement(this.elements[IndexKey.Contracts], name) as
                    | IndexKeyToType[K]
                    | null
            }
            case IndexKey.Funs: {
                return this.findElement(this.elements[IndexKey.Funs], name) as
                    | IndexKeyToType[K]
                    | null
            }
            case IndexKey.Messages: {
                return this.findElement(this.elements[IndexKey.Messages], name) as
                    | IndexKeyToType[K]
                    | null
            }
            case IndexKey.Structs: {
                return this.findElement(this.elements[IndexKey.Structs], name) as
                    | IndexKeyToType[K]
                    | null
            }
            case IndexKey.Traits: {
                return this.findElement(this.elements[IndexKey.Traits], name) as
                    | IndexKeyToType[K]
                    | null
            }
            case IndexKey.Primitives: {
                return this.findElement(this.elements[IndexKey.Primitives], name) as
                    | IndexKeyToType[K]
                    | null
            }
            case IndexKey.Constants: {
                return this.findElement(this.elements[IndexKey.Constants], name) as
                    | IndexKeyToType[K]
                    | null
            }
            default: {
                return null
            }
        }
    }

    private findElement<T extends NamedNode>(elements: T[], name: string): T | null {
        return elements.find(value => value.name() === name) ?? null
    }
}

export class IndexRoot {
    public readonly name: "stdlib" | "stubs" | "workspace"
    public readonly root: string
    public readonly files: Map<string, FileIndex> = new Map()

    public constructor(name: "stdlib" | "stubs" | "workspace", root: string) {
        this.name = name
        this.root = root
    }

    public contains(file: string): boolean {
        return file.startsWith(this.root)
    }

    public addFile(uri: string, file: File, clearCache: boolean = true): void {
        if (this.files.has(uri)) {
            return
        }

        if (clearCache) {
            CACHE.clear()
        }

        const index = FileIndex.create(file)
        this.files.set(uri, index)

        console.info(`added ${uri} to index`)
    }

    public removeFile(uri: string): void {
        CACHE.clear()

        this.files.delete(uri)
        PARSED_FILES_CACHE.delete(uri)

        console.info(`removed ${uri} from index`)
    }

    public fileChanged(uri: string): void {
        CACHE.clear()
        this.files.delete(uri)
        console.info(`found changes in ${uri}`)
    }

    public processElementsByKey(
        key: IndexKey,
        processor: ScopeProcessor,
        state: ResolveState,
    ): boolean {
        for (const value of this.files.values()) {
            if (!value.processElementsByKey(key, processor, state)) return false
        }
        return true
    }

    public processElsByKeyAndFile(
        key: IndexKey,
        file: File,
        processor: ScopeProcessor,
        state: ResolveState,
    ): boolean {
        const fileIndex = this.files.get(file.uri)
        if (fileIndex !== undefined) {
            if (!fileIndex.processElementsByKey(key, processor, state)) return false
        }

        for (const [k, value] of this.files) {
            if (k === file.uri) continue
            if (!value.processElementsByKey(key, processor, state)) return false
        }
        return true
    }

    public elementByName<K extends IndexKey>(key: K, name: string): IndexKeyToType[K] | null {
        for (const value of this.files.values()) {
            const result = value.elementByName(key, name)
            if (result) {
                return result
            }
        }
        return null
    }

    public hasDeclaration(name: string): boolean {
        for (const value of this.files.values()) {
            const element =
                value.elementByName(IndexKey.Funs, name) ??
                value.elementByName(IndexKey.Contracts, name) ??
                value.elementByName(IndexKey.Constants, name) ??
                value.elementByName(IndexKey.Structs, name) ??
                value.elementByName(IndexKey.Messages, name) ??
                value.elementByName(IndexKey.Traits, name) ??
                value.elementByName(IndexKey.Primitives, name)

            if (element) {
                return true
            }
        }
        return false
    }

    public hasSeveralDeclarations(name: string): boolean {
        let seen = false
        for (const value of this.files.values()) {
            const element =
                value.elementByName(IndexKey.Funs, name) ??
                value.elementByName(IndexKey.Contracts, name) ??
                value.elementByName(IndexKey.Constants, name) ??
                value.elementByName(IndexKey.Structs, name) ??
                value.elementByName(IndexKey.Messages, name) ??
                value.elementByName(IndexKey.Traits, name) ??
                value.elementByName(IndexKey.Primitives, name)

            if (element && seen) {
                return true
            }

            if (element) {
                seen = true
            }
        }
        return false
    }
}

export class GlobalIndex {
    private stdlibRoot: IndexRoot | undefined = undefined
    private stubsRoot: IndexRoot | undefined = undefined
    private roots: IndexRoot[] = []

    public withStdlibRoot(root: IndexRoot): void {
        this.stdlibRoot = root
    }

    public withStubsRoot(root: IndexRoot): void {
        this.stubsRoot = root
    }

    public withRoots(roots: IndexRoot[]): void {
        this.roots = roots
    }

    public allRoots(): IndexRoot[] {
        const roots: IndexRoot[] = [...this.roots]
        if (this.stdlibRoot) {
            roots.push(this.stdlibRoot)
        }
        if (this.stubsRoot) {
            roots.push(this.stubsRoot)
        }
        return roots
    }

    public findRootFor(path: string): IndexRoot | undefined {
        for (const root of this.allRoots()) {
            if (root.contains(path)) {
                return root
            }
        }

        console.warn(`cannot find index root for ${path}`)
        return undefined
    }

    public addFile(uri: string, file: File, clearCache: boolean = true): void {
        const indexRoot = this.findRootFor(uri)
        if (!indexRoot) return

        indexRoot.addFile(uri, file, clearCache)
    }

    public removeFile(uri: string): void {
        const indexRoot = this.findRootFor(uri)
        if (!indexRoot) return

        indexRoot.removeFile(uri)
    }

    public fileChanged(uri: string): void {
        const indexRoot = this.findRootFor(uri)
        if (!indexRoot) return

        indexRoot.fileChanged(uri)
    }

    public processElementsByKey(
        key: IndexKey,
        processor: ScopeProcessor,
        state: ResolveState,
    ): boolean {
        for (const root of this.allRoots()) {
            if (!root.processElementsByKey(key, processor, state)) return false
        }

        return true
    }

    public processElsByKeyAndFile(
        key: IndexKey,
        file: File,
        processor: ScopeProcessor,
        state: ResolveState,
    ): boolean {
        for (const root of this.allRoots()) {
            if (!root.processElsByKeyAndFile(key, file, processor, state)) return false
        }

        return true
    }

    public elementByName<K extends IndexKey>(key: K, name: string): IndexKeyToType[K] | null {
        for (const root of this.allRoots()) {
            const element = root.elementByName(key, name)
            if (element) return element
        }
        return null
    }

    public hasSeveralDeclarations(name: string): boolean {
        let seen = false
        for (const root of this.allRoots()) {
            const decl = root.hasDeclaration(name)
            if (decl && seen) {
                return true
            }
            if (decl) {
                const hasSeveralDecls = root.hasSeveralDeclarations(name)
                if (hasSeveralDecls) return true

                seen = true
            }
        }

        return false
    }
}

export const index = new GlobalIndex()
