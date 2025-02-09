import * as path from "node:path"
import {NamedNode} from "./Node"
import {Constant, Contract, Fun, Message, Primitive, Struct, Trait} from "./Decls"
import {Node as SyntaxNode, Tree} from "web-tree-sitter"
import {Position} from "vscode-languageclient"
import {trimSuffix} from "@server/utils/strings"

export class File {
    public constructor(
        public readonly uri: string,
        public readonly tree: Tree,
        public readonly content: string,
    ) {}

    public get fromStdlib(): boolean {
        return this.uri.includes("stdlib")
    }

    public get fromStubs(): boolean {
        return this.uri.endsWith("stubs.tact")
    }

    public get rootNode(): SyntaxNode {
        return this.tree.rootNode
    }

    public symbolAt(offset: number): string {
        return this.content[offset] ?? ""
    }

    public get path(): string {
        return this.uri.slice(7)
    }

    public isImportedImplicitly(): boolean {
        if (this.fromStubs) return true
        if (!this.fromStdlib) return false
        return this.path.includes("std/") || this.path.includes("std\\")
    }

    public positionForNextImport(): Position {
        const imports = this.imports()

        if (imports.length === 0) {
            return {
                line: 0,
                character: 0,
            }
        }

        const lastImport = imports.at(-1)
        if (!lastImport) {
            return {
                line: 0,
                character: 0,
            }
        }

        return {
            line: lastImport.endPosition.row + 1,
            character: lastImport.endPosition.column,
        }
    }

    public alreadyImport(path: string): boolean {
        const imports = this.imports()
            .map(node => node.childForFieldName("library"))
            .filter(node => node !== null)

        return imports.some(imp => imp.text.slice(1, -1) === path)
    }

    public imports() {
        return this.tree.rootNode.children
            .filter(node => node !== null && node.type === "import")
            .filter(node => node !== null)
    }

    public importPath(inFile: File): string {
        const filePath = this.path

        if (this.fromStdlib) {
            const candidates = ["stdlib/libs", "stdlib/std"]
            for (const candidate of candidates) {
                if (filePath.includes(candidate)) {
                    const relative = filePath.slice(
                        filePath.indexOf(candidate) + candidate.length + 1,
                    )
                    const withoutTactExt = trimSuffix(relative, ".tact")
                    return `@stdlib/${withoutTactExt}`
                }
            }

            return filePath
        }

        const relativeTo = path.dirname(inFile.path)
        if (filePath.startsWith(relativeTo)) {
            const relative = filePath.slice(relativeTo.length + 1)
            const withoutTactExt = trimSuffix(relative, ".tact")
            return `./${withoutTactExt}`
        }

        return filePath
    }

    public getDecls(): NamedNode[] {
        return this.getNodesByType(
            [
                "global_function",
                "asm_function",
                "native_function",
                "contract",
                "struct",
                "trait",
                "message",
                "primitive",
                "global_constant",
            ],
            NamedNode,
        )
    }

    public getFuns(): Fun[] {
        return this.getNodesByType(["global_function", "asm_function", "native_function"], Fun)
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
        constructor: new (node: SyntaxNode, file: File) => T,
    ): T[] {
        const tree = this.tree
        const types = Array.isArray(nodeType) ? nodeType : [nodeType]

        return tree.rootNode.children
            .filter(node => node !== null && types.includes(node.type))
            .filter(node => node !== null)
            .map(node => new constructor(node, this))
    }
}
