import type {Node as SyntaxNode} from "web-tree-sitter"

import {RecursiveVisitor} from "@server/psi/visitor"
import {NamedNode, Node} from "./Node"
import {Reference} from "./Reference"
import {File} from "./File"
import {isFunNode, isNamedFunNode, parentOfType} from "./utils"
import {PARSED_FILES_CACHE} from "@server/index-root"
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
    constructor(public node: SyntaxNode) {}

    toString(): string {
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

    constructor(public files: File[]) {}

    toString(): string {
        return `GlobalSearchScope:\n${this.files.map(f => `- ${f.uri}`).join("\n")}`
    }
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
     *
     * @param includeDefinition if true, the first element of the result contains the definition
     * @param includeSelf if true, don't include `self` as usages (for rename)
     * @param sameFileOnly if true, only references from the same files listed
     */
    public findReferences(
        includeDefinition: boolean = false,
        includeSelf: boolean = true,
        sameFileOnly: boolean = false,
    ): Node[] {
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

        this.searchInScope(useScope, sameFileOnly, includeSelf, result)
        return result
    }

    private searchInScope(
        scope: SearchScope,
        sameFileOnly: boolean,
        includeSelf: boolean,
        result: Node[],
    ) {
        if (!this.resolved) return

        if (scope instanceof LocalSearchScope) {
            this.traverseTree(this.resolved.file, scope.node, includeSelf, result)
        }

        if (scope instanceof GlobalSearchScope) {
            if (sameFileOnly) {
                this.traverseTree(this.file, this.file.rootNode, includeSelf, result)
                return
            }

            for (const file of scope.files) {
                this.traverseTree(file, file.rootNode, includeSelf, result)
            }
        }
    }

    private traverseTree(file: File, node: SyntaxNode, includeSelf: boolean, result: Node[]) {
        const resolved = this.resolved
        if (!resolved) return

        // The algorithm for finding references is simple:
        // we traverse the node that contains all the uses and resolve
        // each identifier with the same name as searched symbol.
        // If that identifier refers to the definition we are looking for,
        // we add it to the list.
        RecursiveVisitor.visit(node, (node): boolean => {
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
            if (nodeName !== resolved.name() && nodeName !== "self" && nodeName !== "initOf")
                return true
            if (nodeName === "self" && !includeSelf) return true

            const parent = node.parent
            if (parent === null) return true

            // skip definitions itself
            if (parent.type === "primitive" && parent.childForFieldName("type")?.equals(node)) {
                return true
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
                (identifier.text === resolved.name() || identifier.text === "self")
            ) {
                // found new reference
                result.push(new Node(node, file))
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
            return this.localSearchScope(parentOfType(parent, "function_body", "block_statement"))
        }

        if (parent.type === "foreach_statement") {
            // search only in foreach block
            return this.localSearchScope(parent.lastChild)
        }

        if (parent.type === "catch_clause") {
            // search only in catch block
            return this.localSearchScope(parent.lastChild)
        }

        if (node.type === "parameter") {
            const grand = node.parent?.parent
            if (grand?.type === "asm_function") {
                // search in function body and potentially asm arrangement
                return this.localSearchScope(grand)
            }

            if (parent.type === "receive_function") {
                // search in function body
                return this.localSearchScope(parent)
            }

            if (grand && isFunNode(grand)) {
                // search in function body
                return this.localSearchScope(grand.lastChild)
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
            return this.localSearchScope(owner)
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

    private localSearchScope(node: SyntaxNode | null): SearchScope | null {
        if (!node) return null
        return new LocalSearchScope(node)
    }
}
