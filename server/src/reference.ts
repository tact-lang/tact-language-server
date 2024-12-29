import {SyntaxNode} from 'web-tree-sitter'
import {readFileSync} from "fs";
import {createParser} from "./parser";
import {TypeInferer} from "./TypeInferer";
import {StructTy} from "./types/BaseTy";

export interface ScopeProcessor {
    execute(node: Node): boolean
}

export class File {
    path: string;

    constructor(path: string) {
        this.path = path;
    }

    getFunctions(): Node[] {
        const tree = this.getTree();

        const result: Node[] = [];

        for (const node of tree.rootNode.children) {
            if (node.type === 'global_function' || node.type === 'asm_function') {
                result.push(new Node(node, this))
            }
        }

        return result
    }

    getStructs(): Node[] {
        const content = readFileSync(this.path).toString();
        const parser = createParser()

        const tree = parser.parse(content);

        const result: Node[] = [];

        for (const node of tree.rootNode.children) {
            if (node.type === 'struct') {
                result.push(new Node(node, this))
            }
        }

        return result
    }

    getMessages(): Node[] {
        const content = readFileSync(this.path).toString();
        const parser = createParser()

        const tree = parser.parse(content);

        const result: Node[] = [];

        for (const node of tree.rootNode.children) {
            if (node.type === 'message') {
                result.push(new Node(node, this))
            }
        }

        return result
    }

    getPrimitives(): Node[] {
        const content = readFileSync(this.path).toString();
        const parser = createParser()

        const tree = parser.parse(content);

        const result: Node[] = [];

        for (const node of tree.rootNode.children) {
            if (node.type === 'primitive') {
                result.push(new Node(node, this))
            }
        }

        return result
    }

    private getTree() {
        // TODO: just for now
        const content = readFileSync(this.path).toString();
        const parser = createParser()
        return parser.parse(content);
    }
}

export class Node {
    node: SyntaxNode
    file: File

    constructor(node: SyntaxNode, file: File) {
        this.node = node;
        this.file = file;
    }

    nameIdentifier(): SyntaxNode | null {
        if (this.node.type == 'identifier' || this.node.type == 'type_identifier') {
            return this.node
        }

        if (this.node.type == 'primitive') {
            const nameNode = this.node.childForFieldName('type')
            if (!nameNode) {
                return null
            }
            return nameNode
        }

        const nameNode = this.node.childForFieldName('name')
        if (!nameNode) {
            return null
        }
        return nameNode
    }

    name(): string {
        const ident = this.nameIdentifier()
        if (ident === null) return ""
        return ident.text
    }
}

/**
 * Reference encapsulates the logic of resolving of identifier into its definition.
 *
 * The algorithm used for resolving goes through lists of all possible variants,
 * each of which goes through a specific [`ScopeProcessor`]. ScopeProcessor describes
 * what to do with an element.
 *
 * For example, when resolving names, when definition was found, the processor
 * returns false, which ends the resolving process and the result is returned to
 * the caller (see [`Reference.resolve`]).
 *
 * At the same time, when autocompleting, all possible variants are collected in
 * a list, which becomes the autocompletion list.
 *
 * The description above imposes certain restrictions, for example, when resolving
 * `bar` to `foo.bar`, we must process only methods and fields of type `bar`.
 * This ensures fast resolving, as well as a valid autocompletion list.
 */
export class Reference {
    private readonly element: Node

    constructor(element: Node) {
        this.element = element
    }

    static resolve(node: Node): Node | null {
        return new Reference(node).resolve()
    }

    resolve(): Node | null {
        const result: Node[] = [];
        this.processResolveVariants(this.createResolveProcessor(result, this.element))
        if (result.length == 0) return null;
        return result[0]
    }

    private createResolveProcessor(result: Node[], element: Node): ScopeProcessor {
        return new class implements ScopeProcessor {
            execute(node: Node): boolean {
                if (node.node.equals(element.node)) {
                    result.push(node)
                    return false;
                }

                if (node.name() == element.name()) {
                    result.push(node)
                    return false;
                }

                return true;
            }
        }
    }

    processResolveVariants(processor: ScopeProcessor): boolean {
        const parent = this.element.node.parent!!
        if (parent.type == 'field' && parent.childForFieldName('name')!!.equals(this.element.node)) {
            return processor.execute(new Node(parent, this.element.file))
        }
        if (parent.type == 'parameter' && parent.childForFieldName('name')!!.equals(this.element.node)) {
            return processor.execute(new Node(parent, this.element.file))
        }

        const qualifier = this.getQualifier(this.element)
        if (qualifier === null || qualifier === undefined) {
            return this.processUnqualifiedResolve(processor)
        }

        return this.processQualifiedExpression(qualifier, processor)
    }

    private processQualifiedExpression(qualifier: SyntaxNode, processor: ScopeProcessor): boolean {
        const qualifierType = new TypeInferer().inferType(new Node(qualifier, this.element.file))
        if (qualifierType == null) return true

        if (qualifierType instanceof StructTy) {
            const body = qualifierType.anchor!!.node.childForFieldName('body');
            if (!body) return true
            const fields = body.children.slice(1, -1)

            for (const field of fields) {
                if (!processor.execute(new Node(field, this.element.file))) break
            }
        }

        return true
    }

    private processUnqualifiedResolve(processor: ScopeProcessor): boolean {
        const name = this.element.node.text
        if (!name || name == '_') return true

        if (!this.processFileEntities(this.element.file, processor)) return false
        if (!this.processBlock(processor)) return false

        return true
    }

    private processFileEntities(file: File, processor: ScopeProcessor): boolean {
        if (!this.processNamedElements(processor, file.getFunctions())) return false
        if (!this.processNamedElements(processor, file.getStructs())) return false
        if (!this.processNamedElements(processor, file.getMessages())) return false
        if (!this.processNamedElements(processor, file.getPrimitives())) return false

        return true
    }

    private processBlock(processor: ScopeProcessor) {
        const parent = this.element.node.parent!;
        if (parent.type === 'instance_argument') {
            const name = parent.childForFieldName('name')!
            if (name.equals(this.element.node)) {
                // resolving Foo { name: "" }
                //                 ^^^^ this
                const instanceExpr = parent.parent!.parent!
                const typeExpr = instanceExpr.childForFieldName('name')!
                const resolvedType = Reference.resolve(new Node(typeExpr, this.element.file))
                if (resolvedType == null) return true

                const body = resolvedType.node.childForFieldName('body');
                if (!body) return true
                const fields = body.children.slice(1, -1)

                for (const field of fields) {
                    if (!processor.execute(new Node(field, this.element.file))) break
                }
            }
        }

        let descendant: SyntaxNode | null = this.element.node

        while (descendant) {
            if (descendant.type === 'function_body') {
                for (const child of descendant.children) {
                    if (child.type === 'let_statement') {
                        const name = child.childForFieldName('name')
                        if (name == null) {
                            continue;
                        }

                        if (!processor.execute(new Node(name, this.element.file))) break
                    }
                }
            }

            if (descendant.type == 'foreach_statement') {
                const key = descendant.childForFieldName('key')
                if (key == null) {
                    continue;
                }

                if (!processor.execute(new Node(key, this.element.file))) break

                const value = descendant.childForFieldName('value')
                if (value == null) {
                    continue;
                }

                if (!processor.execute(new Node(value, this.element.file))) break
            }

            if (descendant.type === 'global_function') {
                const rawParameters = descendant.childForFieldName('parameters')
                if (rawParameters == null) continue
                const children = rawParameters.children
                if (children.length < 2) continue
                const params = children.slice(1, -1)

                for (const param of params) {
                    if (!processor.execute(new Node(param, this.element.file))) break
                }
            }

            descendant = descendant.parent
        }

        return false;
    }

    processNamedElements(processor: ScopeProcessor, elements: Node[]): boolean {
        for (const element of elements) {
            if (!processor.execute(element)) return false
        }
        return true
    }

    private getQualifier(node: Node): SyntaxNode | null {
        const parent = node.node.parent
        if (!parent) {
            return null
        }

        if (parent.type == "field_access_expression") {
            const name = parent.childForFieldName('name')
            if (name == null) return null
            if (!name.equals(node.node)) return null
            return parent.child(0)
        }

        if (parent.type == "method_call_expression") {
            const name = parent.childForFieldName('name')
            if (name == null) return null
            if (!name.equals(node.node)) return null
            return parent.child(0)
        }

        return null
    }
}
