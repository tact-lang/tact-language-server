import type {SyntaxNode, Tree} from "web-tree-sitter";

import {RecursiveVisitor} from "../visitor";
import {NamedNode} from "./Node";
import {Reference} from "./Reference";
import {File} from "./File";
import {parentOfType} from "./utils";

/**
 * Referent encapsulates the logic for finding all references to a definition.
 */
export class Referent {
    private readonly resolved: NamedNode | null = null;
    private readonly node: SyntaxNode;
    private readonly file: File;

    public constructor(node: SyntaxNode, file: File) {
        this.file = file;
        this.node = node;
        const element = new NamedNode(node, file)
        this.resolved = Reference.resolve(element)
    }

    /**
     * Returns a list of nodes that reference the definition.
     *
     * @param includeDefinition if true, the first element of the result contains the definition
     */
    public findReferences(includeDefinition: boolean = false): SyntaxNode[] {
        const resolved = this.resolved;
        if (!resolved) return []

        const useScope = this.useScope()
        if (!useScope) return []

        const result: SyntaxNode[] = []
        if (includeDefinition) {
            result.push(resolved.nameIdentifier()!)
        }

        // The algorithm for finding references is simple:
        // we traverse the node that contains all the uses and resolve
        // each identifier. If that identifier refers to the definition
        // we are looking for, we add it to the list.
        //
        // TODO: optimize for field/method search
        //       we don't need to resolve foo in bar.foo in some cases
        RecursiveVisitor.visit(useScope, (node): boolean => {
            // fast path, skip non identifiers
            if (node.type !== 'identifier' && node.type !== 'type_identifier') return true
            // fast path, identifier name doesn't equal to definition name
            if (node.text !== resolved?.name()) return true

            const parent = node.parent
            if (parent === null) return true

            // skip definitions itself
            if (
                parent.type === 'let_statement' ||
                parent.type === 'global_function' ||
                parent.type === 'asm_function' ||
                parent.type === 'field' ||
                parent.type === 'parameter'
            ) {
                return true
            }

            const res = Reference.resolve(new NamedNode(node, resolved.file))
            if (!res) return true

            const identifier = res.nameIdentifier();
            if (!identifier) return true

            if (res.node.type === resolved.node.type && identifier.text === resolved?.name()) {
                // found new reference
                result.push(node)
            }
            return true
        })

        return result
    }

    /**
     * Returns the effective node in which all possible usages are expected.
     * Outside this node, no usages are assumed to exist. For example, variable
     * can be used only in outer block statement where it defined.
     */
    private useScope(): SyntaxNode | null {
        if (!this.resolved) return null

        const parent = this.node.parent
        if (parent === null) return null

        if (parent.type === 'let_statement' || this.resolved.node.parent?.type === 'let_statement') {
            // search only in outer block/function
            return parentOfType(parent, 'function_body', 'block_statement')
        }

        if (parent.type === 'foreach_statement') {
            // search only in foreach block
            return parent.lastChild
        }

        if (parent.type === 'parameter') {
            const grand = parent.parent!.parent!
            if (grand.type === 'global_function') {
                // search in function body
                return grand.lastChild
            }

            if (grand.type === 'asm_function') {
                // search in function body and potentially asm arrangement
                return grand
            }
        }

        if (parent.type === 'global_function' || this.resolved.node.type === 'global_function' ||
            parent.type === 'asm_function' || this.resolved.node.type === 'asm_function') {
            // search in file for now
            return this.file.rootNode
        }

        if (parent.type === 'field') {
            // search in file for now
            return this.file.rootNode
        }

        return null
    }
}
