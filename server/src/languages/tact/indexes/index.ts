//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import {NamedNode} from "@server/languages/tact/psi/TactNode"
import {TactFile} from "@server/languages/tact/psi/TactFile"
import {
    Constant,
    Contract,
    Fun,
    Message,
    Primitive,
    Struct,
    Trait,
} from "@server/languages/tact/psi/Decls"
import {isNamedFunNode} from "@server/languages/tact/psi/utils"
import {ScopeProcessor} from "@server/languages/tact/psi/Reference"
import {CACHE} from "@server/languages/tact/cache"
import {fileURLToPath} from "url"
import {PARSED_FILES_CACHE} from "@server/files"
import {ResolveState} from "@server/psi/ResolveState"

export interface IndexKeyToType {
    readonly [IndexKey.Contracts]: Contract
    readonly [IndexKey.Funs]: Fun
    readonly [IndexKey.Methods]: Fun
    readonly [IndexKey.Messages]: Message
    readonly [IndexKey.Structs]: Struct
    readonly [IndexKey.Traits]: Trait
    readonly [IndexKey.Primitives]: Primitive
    readonly [IndexKey.Constants]: Constant
}

export enum IndexKey {
    Contracts = "Contracts",
    Funs = "Funs",
    Methods = "Methods",
    Messages = "Messages",
    Structs = "Structs",
    Traits = "Traits",
    Primitives = "Primitives",
    Constants = "Constants",
}

export interface IndexFinder {
    processElementsByKey: (key: IndexKey, processor: ScopeProcessor, state: ResolveState) => boolean
}

export class FileIndex {
    private readonly elements: {
        [IndexKey.Contracts]: Contract[]
        [IndexKey.Funs]: Fun[]
        [IndexKey.Methods]: Fun[]
        [IndexKey.Messages]: Message[]
        [IndexKey.Structs]: Struct[]
        [IndexKey.Traits]: Trait[]
        [IndexKey.Primitives]: Primitive[]
        [IndexKey.Constants]: Constant[]
    } = {
        [IndexKey.Contracts]: [],
        [IndexKey.Funs]: [],
        [IndexKey.Methods]: [],
        [IndexKey.Messages]: [],
        [IndexKey.Structs]: [],
        [IndexKey.Traits]: [],
        [IndexKey.Primitives]: [],
        [IndexKey.Constants]: [],
    }

    private readonly deprecated: Map<string, string> = new Map()

    public static create(file: TactFile): FileIndex {
        const index = new FileIndex()

        for (const node of file.rootNode.children) {
            if (!node) continue

            if (isNamedFunNode(node)) {
                const fun = new Fun(node, file)
                index.elements[IndexKey.Funs].push(fun)

                if (fun.withSelf()) {
                    index.elements[IndexKey.Methods].push(fun)
                }

                FileIndex.processDeprecated(index, fun)
            }
            if (node.type === "struct") {
                const struct = new Struct(node, file)
                FileIndex.processDeprecated(index, struct)
                index.elements[IndexKey.Structs].push(struct)
            }
            if (node.type === "contract") {
                const contract = new Contract(node, file)
                FileIndex.processDeprecated(index, contract)
                index.elements[IndexKey.Contracts].push(contract)
            }
            if (node.type === "message") {
                const message = new Message(node, file)
                FileIndex.processDeprecated(index, message)
                index.elements[IndexKey.Messages].push(message)
            }
            if (node.type === "trait") {
                const trait = new Trait(node, file)
                FileIndex.processDeprecated(index, trait)
                index.elements[IndexKey.Traits].push(trait)
            }
            if (node.type === "primitive") {
                // primitive type cannot be deprecated
                index.elements[IndexKey.Primitives].push(new Primitive(node, file))
            }
            if (node.type === "global_constant") {
                const constant = new Constant(node, file)
                FileIndex.processDeprecated(index, constant)
                index.elements[IndexKey.Constants].push(constant)
            }
        }

        return index
    }

    public static processDeprecated(index: FileIndex, symbol: NamedNode): void {
        if (symbol.isDeprecatedNoIndex()) {
            index.deprecated.set(symbol.name(), "")
        }
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
            case IndexKey.Methods: {
                return this.findElement(this.elements[IndexKey.Methods], name) as
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

    public elementsByName<K extends IndexKey>(key: K, name: string): IndexKeyToType[K][] {
        switch (key) {
            case IndexKey.Contracts: {
                return this.findElements(
                    this.elements[IndexKey.Contracts],
                    name,
                ) as IndexKeyToType[K][]
            }
            case IndexKey.Funs: {
                return this.findElements(this.elements[IndexKey.Funs], name) as IndexKeyToType[K][]
            }
            case IndexKey.Methods: {
                return this.findElements(
                    this.elements[IndexKey.Methods],
                    name,
                ) as IndexKeyToType[K][]
            }
            case IndexKey.Messages: {
                return this.findElements(
                    this.elements[IndexKey.Messages],
                    name,
                ) as IndexKeyToType[K][]
            }
            case IndexKey.Structs: {
                return this.findElements(
                    this.elements[IndexKey.Structs],
                    name,
                ) as IndexKeyToType[K][]
            }
            case IndexKey.Traits: {
                return this.findElements(
                    this.elements[IndexKey.Traits],
                    name,
                ) as IndexKeyToType[K][]
            }
            case IndexKey.Primitives: {
                return this.findElements(
                    this.elements[IndexKey.Primitives],
                    name,
                ) as IndexKeyToType[K][]
            }
            case IndexKey.Constants: {
                return this.findElements(
                    this.elements[IndexKey.Constants],
                    name,
                ) as IndexKeyToType[K][]
            }
            default: {
                return []
            }
        }
    }

    private findElement<T extends NamedNode>(elements: T[], name: string): T | null {
        return elements.find(value => value.name() === name) ?? null
    }

    private findElements<T extends NamedNode>(elements: T[], name: string): T[] {
        return elements.filter(value => value.name() === name)
    }

    public isDeprecated(name: string): boolean {
        return this.deprecated.has(name)
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
        if (!file.startsWith("file:")) {
            // most likely VS Code temp file can be only in the workspace
            return this.name === "workspace"
        }
        const filepath = fileURLToPath(file)
        const rootDir = fileURLToPath(this.root)
        return filepath.startsWith(rootDir)
    }

    public addFile(uri: string, file: TactFile, clearCache: boolean = true): void {
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

    public findFile(uri: string): FileIndex | undefined {
        return this.files.get(uri)
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
        file: TactFile,
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

    public elementsByName<K extends IndexKey>(key: K, name: string): IndexKeyToType[K][] {
        for (const value of this.files.values()) {
            const result = value.elementsByName(key, name)
            if (result.length > 0) {
                return result
            }
        }
        return []
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
    public stdlibRoot: IndexRoot | undefined = undefined
    public stubsRoot: IndexRoot | undefined = undefined
    public roots: IndexRoot[] = []

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

    public addFile(uri: string, file: TactFile, clearCache: boolean = true): void {
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

    public findFile(uri: string): FileIndex | undefined {
        const indexRoot = this.findRootFor(uri)
        if (!indexRoot) return undefined

        return indexRoot.findFile(uri)
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
        file: TactFile,
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
