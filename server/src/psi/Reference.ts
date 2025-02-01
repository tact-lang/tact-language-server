import {Node as SyntaxNode} from "web-tree-sitter"
import {
    BouncedTy,
    ContractTy,
    MapTy,
    MessageTy,
    OptionTy,
    PrimitiveTy,
    StorageMembersOwnerTy,
    StructTy,
    TraitTy,
    Ty,
} from "@server/types/BaseTy"
import {index, IndexKey} from "@server/indexes"
import {Expression, NamedNode, Node} from "./Node"
import {File} from "./File"
import {Contract, Field, Fun, Message, Struct, Trait} from "./Decls"
import {isFunNode, parentOfType} from "./utils"
import {CACHE} from "@server/cache"

export class ResolveState {
    private values: Map<string, string> = new Map()

    public get(key: string): string | null {
        return this.values.get(key) ?? null
    }

    public withValue(key: string, value: string): ResolveState {
        const state = new ResolveState()
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
 * For example, when resolving names, when definition was found, the proc
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
        return CACHE.resolveCache.cached(this.element.node.id, () => this.resolveImpl())
    }

    private resolveImpl(): NamedNode | null {
        const result: NamedNode[] = []
        const state = new ResolveState()
        this.processResolveVariants(this.createResolveProcessor(result, this.element), state)
        if (result.length === 0) return null
        return result[0]
    }

    private createResolveProcessor(result: Node[], element: Node): ScopeProcessor {
        return new (class implements ScopeProcessor {
            public execute(node: Node, state: ResolveState): boolean {
                if (node.node.equals(element.node)) {
                    result.push(node)
                    return false
                }

                if (!(node instanceof NamedNode) || !(element instanceof NamedNode)) {
                    return true
                }

                const searchName = state.get("search-name") ?? element.name()

                if (node.name() === searchName) {
                    result.push(node)
                    return false
                }

                return true
            }
        })()
    }

    public processResolveVariants(proc: ScopeProcessor, state: ResolveState): boolean {
        if (this.elementIsDeclarationName()) {
            // foo: Int
            // ^^^ our element
            //
            // so process whole `foo: Int` node
            const parent = this.element.node.parent!
            return proc.execute(this.declarationAstToNode(parent, this.element.file), state)
        }
        if (this.element.node.type === "parameter") {
            return proc.execute(this.element, state)
        }

        const qualifier = this.getQualifier(this.element)
        return qualifier
            ? // foo.bar
              // ^^^ qualifier
              this.processQualifiedExpression(qualifier, proc, state)
            : //  bar()
              // ^ no qualifier
              this.processUnqualifiedResolve(proc, state)
    }

    private elementIsDeclarationName(): boolean {
        // foo: Int
        // ^^^ maybe this
        const identifier = this.element.node

        // foo: Int
        // ^^^^^^^^ this
        const parent = identifier.parent

        // foo: Int
        // ^^^ this
        const name = parent?.childForFieldName("name")
        if (!parent || !name) return false

        // prettier-ignore
        return (
            parent.type === "field" ||
            parent.type === "parameter" ||
            parent.type === "storage_variable" ||
            parent.type === "trait" ||
            parent.type === "struct" ||
            parent.type === "message" ||
            parent.type === "contract" ||
            parent.type === "global_function" ||
            parent.type === "asm_function" ||
            parent.type === "native_function" ||
            parent.type === "storage_function" ||
            parent.type === "storage_constant"
        ) && name.equals(identifier)
    }

    private processQualifiedExpression(
        qualifier: Expression,
        proc: ScopeProcessor,
        state: ResolveState,
    ): boolean {
        const qualifierType = qualifier.type()
        if (qualifierType === null) return true

        if (qualifierType instanceof StructTy || qualifierType instanceof MessageTy) {
            const node = index.elementByName(IndexKey.Primitives, "AnyStruct")
            if (node) {
                const structPrimitiveTy = new PrimitiveTy("AnyStruct", node)
                if (!this.processType(qualifier, structPrimitiveTy, proc, state)) return false
            }
        }

        if (qualifierType instanceof BouncedTy) {
            return this.processType(qualifier, qualifierType.innerTy, proc, state)
        }

        if (qualifierType instanceof OptionTy) {
            // show completion and resolve without explicit unwrapping
            return this.processType(qualifier, qualifierType.innerTy, proc, state)
        }

        return this.processType(qualifier, qualifierType, proc, state)
    }

    private processType(
        qualifier: Expression,
        qualifierType: Ty | StructTy | MessageTy | TraitTy | ContractTy,
        proc: ScopeProcessor,
        state: ResolveState,
    ) {
        const methodRef = qualifier.node.parent?.type === "method_call_expression"

        if (!this.processTypeMethods(qualifierType, proc, state)) return false

        if (qualifierType instanceof StructTy) {
            if (!this.processNamedEls(proc, state, qualifierType.fields())) return false
        }

        if (qualifierType instanceof MessageTy) {
            if (!this.processNamedEls(proc, state, qualifierType.fields())) return false
        }

        // Traits or contracts
        if (qualifierType instanceof StorageMembersOwnerTy) {
            // for `foo.bar()` first check for methods since there is no callable types
            // for `foo.bar` first check for fields since there is no function pointers
            if (methodRef) {
                if (!this.processNamedEls(proc, state, qualifierType.methods())) return false
                if (!this.processNamedEls(proc, state, qualifierType.ownFields())) return false
                if (!this.processNamedEls(proc, state, qualifierType.ownConstants())) return false
            } else {
                if (!this.processNamedEls(proc, state, qualifierType.ownFields())) return false
                if (!this.processNamedEls(proc, state, qualifierType.ownConstants())) return false
                if (!this.processNamedEls(proc, state, qualifierType.methods())) return false
            }
        }

        return true
    }

    private processTypeMethods(ty: Ty, proc: ScopeProcessor, state: ResolveState): boolean {
        return index.processElementsByKey(
            IndexKey.Funs,
            new (class implements ScopeProcessor {
                execute(fun: Node, state: ResolveState): boolean {
                    if (!(fun instanceof Fun)) return true
                    if (!fun.withSelf()) return true
                    const selfParam = fun.parameters()[0]
                    const typeNode = selfParam.node.childForFieldName("type")
                    if (typeNode === null) return true
                    const typeExpr = new Expression(typeNode, fun.file)
                    const selfType = typeExpr.type()
                    if (selfType instanceof MapTy && ty instanceof MapTy) {
                        return proc.execute(fun, state)
                    }

                    if (selfType?.qualifiedName() === ty.qualifiedName()) {
                        return proc.execute(fun, state)
                    }
                    return true
                }
            })(),
            state,
        )
    }

    private processUnqualifiedResolve(proc: ScopeProcessor, state: ResolveState): boolean {
        const name = this.element.node.text
        if (!name || name === "" || name === "_") return true

        if (name === "self") {
            const ownerNode = parentOfType(this.element.node, "contract", "trait")
            if (ownerNode !== null) {
                const constructor = ownerNode.type === "contract" ? Contract : Trait
                const owner = new constructor(ownerNode, this.element.file)

                if (!proc.execute(owner, state.withValue("search-name", owner.name()))) {
                    return false
                }
            }
        }

        // inside a trait/contract, when we write `foo`, we want to automatically complete it
        // with `self.foo` if there are any methods/fields/constants with the same name
        const ownerNode = parentOfType(this.element.node, "contract_body", "trait_body")
        if (ownerNode !== null && state.get("completion")) {
            const constructor = ownerNode.type === "contract_body" ? Contract : Trait
            const owner = new constructor(ownerNode.parent!, this.element.file)
            const typeConstructor = ownerNode.type === "contract_body" ? ContractTy : TraitTy
            const ownerTy = new typeConstructor(owner.name(), owner)
            const expr = new Expression(this.element.node, this.element.file)

            const newState = state.withValue("prefix", "self.")
            if (!this.processType(expr, ownerTy, proc, newState)) return false
        }

        const parent = this.element.node.parent!
        if (parent.type === "tvm_ordinary_word") {
            // don't try to resolve TVM assembly
            return true
        }

        // first we need to check block since we have such case
        // ```
        // let name = "";
        // Foo { name };
        // ````
        if (!this.processBlock(proc, state)) return false

        if (parent.type === "instance_argument") {
            // `Foo { name: "" }`
            //        ^^^^^^^^ this
            if (!this.resolveInstanceInitField(parent, proc, state)) return false
        }

        if (parent.type === "asm_arrangement_args") {
            // `asm(cell self) extends fun storeRef(self: Builder, cell: Cell): Builder`
            //           ^^^^ this
            return this.resolveAsmArrangementArgs(parent, proc, state)
        }

        return this.processAllEntities(proc, state)
    }

    private resolveInstanceInitField(
        parent: SyntaxNode,
        proc: ScopeProcessor,
        state: ResolveState,
    ): boolean {
        // resolving `Foo { name: "" }`
        //                  ^^^^ this

        const name = parent.childForFieldName("name")!
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
        const typeExpr = instanceExpr.childForFieldName("name")!

        const resolvedType = Reference.resolve(new NamedNode(typeExpr, this.element.file))
        if (resolvedType === null) return true

        const body = resolvedType.node.childForFieldName("body")
        if (!body) return true
        const fields = body.children.slice(1, -1)

        for (const field of fields) {
            if (!field) continue
            if (!proc.execute(new Field(field, resolvedType.file), state)) return false
        }
        return true
    }

    private resolveAsmArrangementArgs(
        parent: SyntaxNode,
        proc: ScopeProcessor,
        state: ResolveState,
    ): boolean {
        // resolving `asm(cell self) extends fun storeRef(self: Builder, cell: Cell): Builder`
        //                     ^^^^ this

        const asmFun = parentOfType(parent, "asm_function")
        if (!asmFun) return true

        const rawParameters = asmFun.childForFieldName("parameters")
        if (rawParameters === null) return true
        const children = rawParameters.children
        if (children.length < 2) return true
        const params = children.slice(1, -1)

        for (const param of params) {
            if (!param) continue
            if (!proc.execute(new NamedNode(param, this.element.file), state)) break
        }

        return true
    }

    private processAllEntities(proc: ScopeProcessor, state: ResolveState): boolean {
        if (!index.processElementsByKey(IndexKey.Primitives, proc, state)) return false
        if (!index.processElementsByKey(IndexKey.Funs, proc, state)) return false
        if (!index.processElementsByKey(IndexKey.Structs, proc, state)) return false
        if (!index.processElementsByKey(IndexKey.Messages, proc, state)) return false
        if (!index.processElementsByKey(IndexKey.Traits, proc, state)) return false
        if (!index.processElementsByKey(IndexKey.Constants, proc, state)) return false
        return index.processElementsByKey(IndexKey.Contracts, proc, state)
    }

    private processBlock(proc: ScopeProcessor, state: ResolveState) {
        const file = this.element.file
        let descendant: SyntaxNode | null = this.element.node

        while (descendant) {
            // walk all variables inside block
            if (descendant.type === "block_statement" || descendant.type === "function_body") {
                const statements = descendant.children
                for (const stmt of statements) {
                    if (!stmt) continue
                    if (stmt.type === "let_statement") {
                        // let name = expr;
                        //     ^^^^ this
                        const name = stmt.childForFieldName("name")
                        if (name === null) continue
                        if (!proc.execute(new NamedNode(name, file), state)) return false
                    }
                }
            }

            if (descendant.type === "foreach_statement") {
                // foreach (key, value in expr)
                //          ^^^ this
                const key = descendant.childForFieldName("key")
                if (key === null) continue
                if (!proc.execute(new NamedNode(key, file), state)) return false

                // foreach (key, value in expr)
                //               ^^^^^ this
                const value = descendant.childForFieldName("value")
                if (value === null) continue
                if (!proc.execute(new NamedNode(value, file), state)) return false
            }

            if (descendant.type === "catch_clause") {
                const name = descendant.childForFieldName("name")
                if (name === null) continue
                if (!proc.execute(new NamedNode(name, file), state)) return false
            }

            // process parameters of function
            if (isFunNode(descendant)) {
                const rawParameters = descendant.childForFieldName("parameters")
                if (rawParameters === null) {
                    const parameter = descendant.childForFieldName("parameter")
                    if (parameter === null) continue

                    if (!proc.execute(new NamedNode(parameter, file), state)) return false
                } else {
                    const children = rawParameters.children
                    if (children.length < 2) continue
                    const params = children.slice(1, -1)

                    for (const param of params) {
                        if (!param) continue
                        if (!proc.execute(new NamedNode(param, file), state)) return false
                    }
                }
            }

            descendant = descendant.parent
        }

        return true
    }

    public processNamedEls(
        proc: ScopeProcessor,
        state: ResolveState,
        elements: NamedNode[],
    ): boolean {
        for (const element of elements) {
            if (!proc.execute(element, state)) return false
        }
        return true
    }

    private getQualifier(node: Node): Expression | null {
        const parent = node.node.parent
        if (!parent) {
            return null
        }

        if (parent.type === "field_access_expression") {
            const name = parent.childForFieldName("name")
            if (name === null) return null
            if (!name.equals(node.node)) return null
            return new Expression(parent.child(0)!, node.file)
        }

        if (parent.type === "method_call_expression") {
            const name = parent.childForFieldName("name")
            if (name === null) return null
            if (!name.equals(node.node)) return null
            return new Expression(parent.child(0)!, node.file)
        }

        return null
    }

    private declarationAstToNode(node: SyntaxNode, file: File): NamedNode {
        if (node.type === "struct") {
            return new Struct(node, file)
        }
        if (node.type === "message") {
            return new Message(node, file)
        }
        if (node.type === "trait") {
            return new Trait(node, file)
        }
        if (node.type === "contract") {
            return new Contract(node, file)
        }
        return new NamedNode(node, file)
    }
}
