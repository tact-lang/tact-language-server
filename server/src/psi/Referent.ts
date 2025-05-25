import type {Node as SyntaxNode} from "web-tree-sitter"
import {RecursiveVisitor} from "@server/psi/visitor"
import {NamedNode, Node} from "./Node"
import {Reference} from "./Reference"
import type {File} from "./File"
import {isFunNode, isNamedFunNode, parentOfType} from "./utils"
import {PARSED_FILES_CACHE} from "@server/indexing-root"
import {Contract} from "@server/psi/Decls"

/**
 * Describes a scope that contains all possible uses of a certain symbol.
 */
export interface SearchScope {
    toString(): string
}

/**
 * Describes the scope described by some AST node, the search for usages will be
 * performed only within this node.
 *
 * For example, the scope for a local variable will be the block in which it is defined.
 */
export class LocalSearchScope implements SearchScope {
    public constructor(public node: SyntaxNode) {}

    public toString(): string {
        return `LocalSearchScope:\n${this.node.text}`
    }
}

/**
 * Describes a scope consisting of one or more files.
 *
 * For example, the scope of a global function from the standard library is all project files.
 */
export class GlobalSearchScope implements SearchScope {
    public static allFiles(): GlobalSearchScope {
        const files = [...PARSED_FILES_CACHE.values()]
        return new GlobalSearchScope(files)
    }

    public constructor(public files: File[]) {}

    public toString(): string {
        return `GlobalSearchScope:\n${this.files.map(f => `- ${f.uri}`).join("\n")}`
    }
}

export interface FindReferenceOptions {
    /**
     * if true, the first element of the result contains the definition
     */
    readonly includeDefinition?: boolean
    /**
     * if true, don't include `self` as usages (for rename)
     */
    readonly includeSelf?: boolean
    /**
     * if true, only references from the same files listed
     */
    readonly sameFileOnly?: boolean
    /**
     * search stops after `limit` number of references are found
     */
    readonly limit?: number
}

/**
 * Referent encapsulates the logic for finding all references to a definition.
 *
 * The search logic is simple, each symbol has a certain scope in which it can be used.
 * If it is a local variable, then the block in which it is defined, if a parameter, then
 * the function in which it is defined. If it is a global function, then all project files.
 *
 * When the scope is defined, it is enough to go through all the nodes from it and find those
 * that refer to the searched element.
 * For optimization, we do not try to resolve each identifier, we resolve only those that have
 * the same name as the searched element (and a bit of logic for processing `self`).
 *
 * Searching for uses of global symbols can be improved, now we use all files from the index,
 * but following the Tact imports logic we can reduce the search scope. For example, when searching
 * for uses of a global function defined within the project, there is no point in searching
 * for its uses within the standard library.
 * These optimizations and improvements are the object of further work.
 */
export class Referent {
    private readonly resolved: NamedNode | null = null
    private readonly file: File

    public constructor(node: SyntaxNode, file: File) {
        this.file = file
        const element = new NamedNode(node, file)
        this.resolved = Reference.resolve(element)
    }

    /**
     * Returns a list of nodes that reference the definition.
     */
    public findReferences({
        includeDefinition = false,
        includeSelf = true,
        sameFileOnly = false,
        limit = Infinity,
    }: FindReferenceOptions): Node[] {
        const resolved = this.resolved
        if (!resolved) return []

        const useScope = this.useScope()
        if (!useScope) return []

        const result: Node[] = []
        if (includeDefinition && (!sameFileOnly || resolved.file.uri === this.file.uri)) {
            const nameNode = resolved.nameNode()
            if (nameNode) {
                result.push(nameNode)
            }
        }

        this.searchInScope(useScope, sameFileOnly, includeSelf, result, limit)
        return result
    }

    private searchInScope(
        scope: SearchScope,
        sameFileOnly: boolean,
        includeSelf: boolean,
        result: Node[],
        limit: number,
    ): void {
        if (!this.resolved) return

        if (scope instanceof LocalSearchScope) {
            this.traverseTree(this.resolved.file, scope.node, includeSelf, result, limit)
        }

        if (scope instanceof GlobalSearchScope) {
            if (sameFileOnly) {
                this.traverseTree(this.file, this.file.rootNode, includeSelf, result, limit)
                return
            }

            for (const file of scope.files) {
                this.traverseTree(file, file.rootNode, includeSelf, result, limit)
                if (result.length === limit) {
                    break
                }
            }
        }
    }

    private traverseTree(
        file: File,
        node: SyntaxNode,
        includeSelf: boolean,
        result: Node[],
        limit: number,
    ): void {
        const resolved = this.resolved
        if (!resolved) return

        // The algorithm for finding references is simple:
        // we traverse the node that contains all the uses and resolve
        // each identifier with the same name as searched symbol.
        // If that identifier refers to the definition we are looking for,
        // we add it to the list.
        RecursiveVisitor.visit(node, (node): boolean | "stop" => {
            // fast path, skip non identifiers
            if (
                node.type !== "identifier" &&
                node.type !== "self" &&
                node.type !== "initOf" &&
                node.type !== "type_identifier"
            ) {
                return true
            }
            // fast path, identifier name doesn't equal to definition name
            // self can refer to enclosing trait or contract
            const nodeName = node.text
            if (nodeName !== resolved.name() && nodeName !== "self" && nodeName !== "initOf") {
                return true
            }
            if (nodeName === "self" && !includeSelf) return true

            const parent = node.parent
            if (parent === null) return true

            // skip definitions itself
            if (parent.type === "primitive" && parent.childForFieldName("type")?.equals(node)) {
                return true
            }
            if (parent.type === "destruct_bind") {
                const target = parent.childForFieldName("bind") ?? parent.childForFieldName("name")
                if (target && target.equals(node)) {
                    return true
                }
            }
            // prettier-ignore
            if ((
                parent.type === "let_statement" ||
                parent.type === "global_function" ||
                parent.type === "asm_function" ||
                parent.type === "native_function" ||
                parent.type === "storage_function" ||
                parent.type === "storage_constant" ||
                parent.type === "storage_variable" ||
                parent.type === "global_constant" ||
                parent.type === "trait" ||
                parent.type === "struct" ||
                parent.type === "message" ||
                parent.type === "contract" ||
                parent.type === "primitive" ||
                parent.type === "field" ||
                parent.type === "parameter") && parent.childForFieldName("name")?.equals(node)
            ) {
                return true
            }

            const res = Reference.resolve(new NamedNode(node, file))
            if (!res) return true

            // check if this `initOf Foo()` reference our `init` function
            if (res.node.type === "init" && nodeName === "initOf") {
                const owner = parentOfType(resolved.node, "contract")
                if (!owner) return true
                if (owner.type !== "contract") return true
                const initOf = node.parent
                const name = initOf?.childForFieldName("name") ?? null
                if (!name) return true

                const ownerContract = new Contract(owner, file)

                if (ownerContract.name() !== name.text) {
                    // initOf for other contract
                    return true
                }

                // found new reference
                result.push(new Node(node, file))
                return true
            }

            const identifier = res.nameIdentifier()
            if (!identifier) return true

            if (
                res.node.type === resolved.node.type &&
                res.file.uri === resolved.file.uri &&
                res.node.startPosition.row === resolved.node.startPosition.row &&
                (identifier.text === resolved.name() || identifier.text === "self")
            ) {
                // found new reference
                result.push(new Node(node, file))
                if (result.length === limit) return "stop" // end iteration
            }
            return true
        })
    }

    /**
     * Returns the effective node in which all possible usages are expected.
     * Outside this node, no usages are assumed to exist. For example, variable
     * can be used only in outer block statement where it defined.
     */
    public useScope(): SearchScope | null {
        if (!this.resolved) return null

        const node = this.resolved.node

        const parent = this.resolved.node.parent
        if (parent === null) return null

        if (parent.type === "let_statement") {
            // search only in outer block/function
            return Referent.localSearchScope(
                parentOfType(parent, "function_body", "block_statement"),
            )
        }

        // let Foo { name, other: value } = foo()
        //           ^^^^  ^^^^^^^^^^^^^
        if (parent.type === "destruct_bind") {
            // search only in outer block/function
            return Referent.localSearchScope(
                parentOfType(parent, "function_body", "block_statement"),
            )
        }

        if (parent.type === "foreach_statement") {
            // search only in foreach block
            return Referent.localSearchScope(parent.lastChild)
        }

        if (parent.type === "catch_clause") {
            // search only in catch block
            return Referent.localSearchScope(parent.lastChild)
        }

        if (node.type === "parameter") {
            const grand = node.parent?.parent
            if (grand?.type === "asm_function") {
                // search in function body and potentially asm arrangement
                return Referent.localSearchScope(grand)
            }

            if (parent.type === "receive_function") {
                // search in function body
                return Referent.localSearchScope(parent)
            }

            if (grand && isFunNode(grand)) {
                // search in function body
                return Referent.localSearchScope(grand.lastChild)
            }

            // contract Foo(value: Int) {}
            //              ^^^^^ this
            if (grand?.type === "contract") {
                return Referent.localSearchScope(grand.lastChild)
            }
        }

        if (
            node.type === "storage_variable" ||
            node.type === "storage_constant" ||
            node.type === "storage_function"
        ) {
            const owner = parentOfType(parent, "contract", "trait")
            if (owner?.type === "trait") {
                // can be used in other traits, optimize?
                return GlobalSearchScope.allFiles()
            }
            // search in whole contract
            return Referent.localSearchScope(owner)
        }

        if (
            isNamedFunNode(parent) ||
            isNamedFunNode(node) ||
            node.type === "global_constant" ||
            node.type === "contract" ||
            node.type === "trait" ||
            node.type === "primitive" ||
            node.type === "struct" ||
            node.type === "message"
        ) {
            return GlobalSearchScope.allFiles()
        }

        if (node.type === "field") {
            return GlobalSearchScope.allFiles()
        }

        if (this.resolved.node.type === "init_function") {
            return GlobalSearchScope.allFiles()
        }

        return null
    }

    private static localSearchScope(node: SyntaxNode | null): SearchScope | null {
        if (!node) return null
        return new LocalSearchScope(node)
    }
}
