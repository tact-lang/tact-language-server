import {SyntaxNode, Tree} from "web-tree-sitter";
import {File, Node, Reference} from "./reference";
import {RecursiveVisitor} from "./visitor";

/**
 * Referent encapsulates the logic for finding all references to a definition.
 */
export class Referent {
    private readonly resolved: Node | null = null;

    constructor(private node: SyntaxNode, file: string, private tree: Tree) {
        const element = new Node(node, new File(file))
        this.resolved = Reference.resolve(element)
    }

    /**
     * Returns a list of nodes that reference the definition.
     *
     * @param includeDefinition if true, the first element of the result contains the definition
     */
    findReferences(includeDefinition: boolean = false): SyntaxNode[] {
        if (!this.resolved) return []

        const useScope = this.useScope()
        if (!useScope) return []

        const result: SyntaxNode[] = []
        if (includeDefinition) {
            result.push(this.resolved.nameIdentifier()!)
        }

        // The algorithm for finding references is simple:
        // we traverse the node that contains all the uses and resolve
        // each identifier. If that identifier refers to the definition
        // we are looking for, we add it to the list.
        //
        // TODO: optimize for field/method search
        //       we don't need to resolve foo in bar.foo in some cases
        RecursiveVisitor.visit(useScope, (n): boolean => {
            if (n.type !== 'identifier' && n.type !== 'type_identifier') return true // fast path, skip non identifiers
            if (n.text !== this.resolved!.name()) return true // fast path, identifier name doesn't equal to definition name

            const parent = n.parent
            if (parent === null) return true

            // skip definitions itself
            if (parent.type === 'let_statement' || parent.type === 'global_function') return true

            const res = Reference.resolve(this.resolved!)
            if (!res) return true

            const identifier = res.nameIdentifier();
            if (!identifier) return true

            if (identifier.text == this.resolved!.name()) {
                // found new reference
                result.push(n)
            }
            return true
        })

        return result
    }

    /**
     * Returns the effective node in which all possible usages are expected.
     * Outside this node, no usages are assumed to exist. For example, variable
     * can be used only in outer block statement.
     */
    private useScope(): SyntaxNode | null {
        if (!this.resolved) return null

        const parent = this.node.parent
        if (parent === null) return null

        if (parent.type === 'let_statement' || this.resolved.node.parent!.type === 'let_statement') {
            // search only in outer block/function
            return parentOfType(parent, 'function_body', 'block_statement')
        }

        if (parent.type === 'foreach_statement') {
            // search only in foreach block
            return parent.lastChild
        }

        if (parent.type === 'parameter') {
            let grand = parent.parent!.parent!
            if (grand.type === 'global_function') {
                // search in function body
                return grand.lastChild
            }
        }

        if (parent.type === 'global_function' || this.resolved.node.type === 'global_function') {
            // search in file for now
            return this.tree.rootNode
        }

        return null
    }
}

function parentOfType(node: SyntaxNode, ...types: string[]): SyntaxNode | null {
    let parent = node.parent

    while (true) {
        if (parent == null) return null
        if (types.find(type => parent!.type === type)) return parent
        parent = parent.parent
    }
}
