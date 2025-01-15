import {SyntaxNode} from 'web-tree-sitter'
import {BouncedTy, ContractTy, MessageTy, StructTy, TraitTy, Ty} from "../types/BaseTy";
import {index, IndexKey} from "../indexes";
import {Expression, NamedNode, Node} from "./Node";
import {Contract, Function, Trait} from "./TopLevelDeclarations";
import {File} from "./File";
import {isFunctionNode, parentOfType} from "./utils";

export class ResolveState {
    private values: Map<string, string> = new Map();

    public get(key: string): string | null {
        return this.values.get(key) ?? null;
    }

    public withValue(key: string, value: string): ResolveState {
        const state = new ResolveState();
        state.values = this.values.set(key, value)
        return state
    }
}

export interface ScopeProcessor {
    execute(node: Node, state: ResolveState): boolean
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
    private readonly element: NamedNode

    public static resolve(node: NamedNode | null): NamedNode | null {
        if (node === null) return null
        return new Reference(node).resolve()
    }

    public constructor(element: NamedNode) {
        this.element = element
    }

    public resolve(): NamedNode | null {
        const result: NamedNode[] = [];
        const state = new ResolveState();
        this.processResolveVariants(this.createResolveProcessor(result, this.element), state)
        if (result.length === 0) return null;
        return result[0]
    }

    private createResolveProcessor(result: Node[], element: Node): ScopeProcessor {
        return new class implements ScopeProcessor {
            public execute(node: Node, state: ResolveState): boolean {
                if (node.node.equals(element.node)) {
                    result.push(node)
                    return false
                }

                if (!(node instanceof NamedNode) || !(element instanceof NamedNode)) {
                    return false
                }

                const searchName = state.get('search-name') ?? element.name()

                if (node.name() === searchName) {
                    result.push(node)
                    return false
                }

                return true
            }
        }
    }

    public processResolveVariants(processor: ScopeProcessor, state: ResolveState): boolean {
        if (this.elementIsDeclarationName()) {
            // foo: Int
            // ^^^ our element
            //
            // so process whole `foo: Int` node
            const parent = this.element.node.parent!
            return processor.execute(new NamedNode(parent, this.element.file), state)
        }
        if (this.element.node.type === 'parameter') {
            return processor.execute(this.element, state)
        }

        const qualifier = this.getQualifier(this.element)
        return qualifier ?
            // foo.bar
            // ^^^ qualifier
            this.processQualifiedExpression(qualifier, processor, state) :
            //  bar()
            // ^ no qualifier
            this.processUnqualifiedResolve(processor, state)
    }

    private elementIsDeclarationName(): boolean {
        // foo: Int
        // ^^^ maybe this
        const identifier = this.element.node;

        // foo: Int
        // ^^^^^^^^ this
        const parent = identifier.parent

        // foo: Int
        // ^^^ this
        const name = parent?.childForFieldName('name')
        if (!parent || !name) return false

        return (
            parent.type === 'field' ||
            parent.type === 'parameter' ||
            parent.type === 'storage_variable' ||
            parent.type === 'storage_function' ||
            parent.type === 'storage_constant'
        ) && name.equals(identifier)
    }

    private processQualifiedExpression(qualifier: Expression, processor: ScopeProcessor, state: ResolveState): boolean {
        const qualifierType = qualifier.type()
        if (qualifierType === null) return true

        if (qualifierType instanceof BouncedTy) {
            return this.processType(qualifierType.innerTy, processor, state);
        }

        return this.processType(qualifierType, processor, state);
    }

    private processType(qualifierType: Ty | StructTy | MessageTy | TraitTy | ContractTy, processor: ScopeProcessor, state: ResolveState) {
        if (!this.processTypeMethods(qualifierType, processor, state)) return false

        if (qualifierType instanceof StructTy) {
            if (!this.processNamedElements(processor, state, qualifierType.fields())) return false
        }

        if (qualifierType instanceof MessageTy) {
            if (!this.processNamedElements(processor, state, qualifierType.fields())) return false
        }

        if (qualifierType instanceof TraitTy) {
            if (!this.processNamedElements(processor, state, qualifierType.ownFields())) return false
            if (!this.processNamedElements(processor, state, qualifierType.ownConstants())) return false
            if (!this.processNamedElements(processor, state, qualifierType.methods())) return false
        }

        if (qualifierType instanceof ContractTy) {
            if (!this.processNamedElements(processor, state, qualifierType.ownFields())) return false
            if (!this.processNamedElements(processor, state, qualifierType.ownConstants())) return false
            if (!this.processNamedElements(processor, state, qualifierType.methods())) return false
        }

        return true
    }

    private processTypeMethods(ty: Ty, processor: ScopeProcessor, state: ResolveState): boolean {
        const candidates = index.elementsByKey(IndexKey.Functions).filter(fun => {
            if (!(fun instanceof Function)) return false
            if (!fun.withSelf()) return false
            const selfParam = fun.parameters()[0]
            const typeNode = selfParam.node.childForFieldName('type');
            if (typeNode === null) return false
            const typeExpr = new Expression(typeNode, fun.file)
            const selfType = typeExpr.type()
            return selfType?.qualifiedName() === ty.qualifiedName()
        })
        return this.processNamedElements(processor, state, candidates);
    }

    private processUnqualifiedResolve(processor: ScopeProcessor, state: ResolveState): boolean {
        const name = this.element.node.text
        if (!name || name === '_') return true

        if (name === 'self') {
            const ownerNode = parentOfType(this.element.node, 'contract', 'trait')
            if (ownerNode !== null) {
                const constructor = ownerNode.type === 'contract' ? Contract : Trait
                const owner = new constructor(ownerNode, this.element.file)

                if (!processor.execute(owner, state.withValue("search-name", owner.name()))) return false
            }
        }

        const parent = this.element.node.parent!;
        if (parent.type === 'instance_argument') {
            // `Foo { name: "" }`
            //        ^^^^^^^^ this
            return this.resolveInstanceInitField(parent, processor, state)
        }

        if (parent.type === 'asm_arrangement_args') {
            // `asm(cell self) extends fun storeRef(self: Builder, cell: Cell): Builder`
            //           ^^^^ this
            return this.resolveAsmArrangementArgs(parent, processor, state)
        }

        if (!this.processFileEntities(this.element.file, processor, state)) return false
        if (!this.processAllEntities(processor, state)) return false
        if (!this.processBlock(processor, state)) return false

        return true
    }

    private resolveInstanceInitField(parent: SyntaxNode, processor: ScopeProcessor, state: ResolveState): boolean {
        // resolving `Foo { name: "" }`
        //                  ^^^^ this

        const name = parent.childForFieldName('name')!
        if (!name.equals(this.element.node)) {
            // `Foo { name: "" }`
            //        ^^^^ this should be our identifier to resolve
            return true
        }

        // `Foo { name: "" }`
        //  ^^^^^^^^^^^^^^^^ this
        const instanceExpr = parent.parent!.parent!

        // `Foo { name: "" }`
        //  ^^^ this
        const typeExpr = instanceExpr.childForFieldName('name')!

        const resolvedType = Reference.resolve(new NamedNode(typeExpr, this.element.file))
        if (resolvedType === null) return true

        const body = resolvedType.node.childForFieldName('body')
        if (!body) return true
        const fields = body.children.slice(1, -1)

        for (const field of fields) {
            if (!processor.execute(new NamedNode(field, resolvedType.file), state)) return false
        }
        return true
    }

    private resolveAsmArrangementArgs(parent: SyntaxNode, processor: ScopeProcessor, state: ResolveState): boolean {
        // resolving `asm(cell self) extends fun storeRef(self: Builder, cell: Cell): Builder`
        //                     ^^^^ this

        const asmFunction = parentOfType(parent, 'asm_function')
        if (!asmFunction) return true

        const rawParameters = asmFunction.childForFieldName('parameters')
        if (rawParameters === null) return true
        const children = rawParameters.children
        if (children.length < 2) return true
        const params = children.slice(1, -1)

        for (const param of params) {
            if (!processor.execute(new NamedNode(param, this.element.file), state)) break
        }

        return true
    }

    private processFileEntities(file: File, processor: ScopeProcessor, state: ResolveState): boolean {
        if (!this.processNamedElements(processor, state, file.getFunctions())) return false
        if (!this.processNamedElements(processor, state, file.getContracts())) return false
        if (!this.processNamedElements(processor, state, file.getStructs())) return false
        if (!this.processNamedElements(processor, state, file.getTraits())) return false
        if (!this.processNamedElements(processor, state, file.getMessages())) return false
        if (!this.processNamedElements(processor, state, file.getPrimitives())) return false
        if (!this.processNamedElements(processor, state, file.getConstants())) return false

        return true
    }

    private processAllEntities(processor: ScopeProcessor, state: ResolveState): boolean {
        if (!this.processNamedElements(processor, state, index.elementsByKey(IndexKey.Functions))) return false
        if (!this.processNamedElements(processor, state, index.elementsByKey(IndexKey.Contracts))) return false
        if (!this.processNamedElements(processor, state, index.elementsByKey(IndexKey.Structs))) return false
        if (!this.processNamedElements(processor, state, index.elementsByKey(IndexKey.Messages))) return false
        if (!this.processNamedElements(processor, state, index.elementsByKey(IndexKey.Traits))) return false
        if (!this.processNamedElements(processor, state, index.elementsByKey(IndexKey.Primitives))) return false
        if (!this.processNamedElements(processor, state, index.elementsByKey(IndexKey.Constants))) return false

        return true
    }

    private processBlock(processor: ScopeProcessor, state: ResolveState) {
        let descendant: SyntaxNode | null = this.element.node

        while (descendant) {
            // walk all variables inside block
            if (descendant.type === 'block_statement' || descendant.type === 'function_body') {
                const statements = descendant.children;
                for (const stmt of statements) {
                    if (stmt.type === 'let_statement') {
                        // let name = expr;
                        //     ^^^^ this
                        const name = stmt.childForFieldName('name')
                        if (name === null) continue;
                        if (!processor.execute(new NamedNode(name, this.element.file), state)) break
                    }
                }
            }

            if (descendant.type === 'foreach_statement') {
                // foreach (key, value in expr)
                //          ^^^ this
                const key = descendant.childForFieldName('key')
                if (key === null) continue;
                if (!processor.execute(new NamedNode(key, this.element.file), state)) break

                // foreach (key, value in expr)
                //               ^^^^^ this
                const value = descendant.childForFieldName('value')
                if (value === null) continue;
                if (!processor.execute(new NamedNode(value, this.element.file), state)) break
            }

            // process parameters of function
            if (isFunctionNode(descendant)) {
                const rawParameters = descendant.childForFieldName('parameters')
                if (rawParameters === null) {
                    const parameter = descendant.childForFieldName('parameter')
                    if (parameter === null) continue

                    if (!processor.execute(new NamedNode(parameter, this.element.file), state)) break
                } else {
                    const children = rawParameters.children
                    if (children.length < 2) continue
                    const params = children.slice(1, -1)

                    for (const param of params) {
                        if (!processor.execute(new NamedNode(param, this.element.file), state)) break
                    }
                }
            }

            descendant = descendant.parent
        }

        return false;
    }

    public processNamedElements(processor: ScopeProcessor, state: ResolveState, elements: NamedNode[]): boolean {
        for (const element of elements) {
            if (!processor.execute(element, state)) return false
        }
        return true
    }

    private getQualifier(node: Node): Expression | null {
        const parent = node.node.parent
        if (!parent) {
            return null
        }

        if (parent.type === "field_access_expression") {
            const name = parent.childForFieldName('name')
            if (name === null) return null
            if (!name.equals(node.node)) return null
            return new Expression(parent.child(0)!, node.file)
        }

        if (parent.type === "method_call_expression") {
            const name = parent.childForFieldName('name')
            if (name === null) return null
            if (!name.equals(node.node)) return null
            return new Expression(parent.child(0)!, node.file)
        }

        return null
    }
}
