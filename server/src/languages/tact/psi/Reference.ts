//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type {Node as SyntaxNode} from "web-tree-sitter"
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
} from "@server/languages/tact/types/BaseTy"
import {index, IndexFinder, IndexKey} from "@server/languages/tact/indexes"
import {CallLike, Expression, NamedNode, TactNode} from "./TactNode"
import type {TactFile} from "./TactFile"
import {Contract, Field, FieldsOwner, Fun, Message, Struct, Trait} from "./Decls"
import {isFunNode, parentOfType} from "./utils"
import {CACHE} from "@server/languages/tact/cache"
import {TypeInferer} from "@server/languages/tact/TypeInferer"
import {ImportResolver} from "@server/languages/tact/psi/ImportResolver"
import {filePathToUri} from "@server/files"
import {ResolveState} from "@server/psi/ResolveState"

export interface ScopeProcessor {
    execute(node: TactNode, state: ResolveState): boolean
}

/**
 * Reference encapsulates the logic of resolving of identifier into its definition.
 *
 * The algorithm used for resolving goes through lists of all possible variants,
 * each of which goes through a specific [`ScopeProcessor`]. ScopeProcessor describes
 * what to do with an element.
 *
 * For example, when resolving names, when definition was found, the proc
 * returns false, which ends the resolving process, and the result is returned to
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
        if (this.element.node.startIndex === this.element.node.endIndex) return null
        if (this.element.node.parent?.type === "tlb_serialization") return null

        const result: NamedNode[] = []
        const state = new ResolveState()
        this.processResolveVariants(Reference.createResolveProcessor(result, this.element), state)
        if (result.length === 0) return null
        return result[0]
    }

    private static createResolveProcessor(result: TactNode[], element: TactNode): ScopeProcessor {
        return new (class implements ScopeProcessor {
            public execute(node: TactNode, state: ResolveState): boolean {
                if (node.node.equals(element.node)) {
                    result.push(node)
                    return false
                }

                if (node.node.type === "init" && state.get("search-name") === "init") {
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
            const parent = this.element.node.parent
            if (!parent) return true
            return proc.execute(Reference.declarationAstToNode(parent, this.element.file), state)
        }
        if (this.element.node.type === "parameter") {
            return proc.execute(this.element, state)
        }

        const qualifier = Reference.getQualifier(this.element)
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

        // init()
        // ^^^^^^ this
        if (parent?.type === "init_function") {
            return true
        }

        // foo: Int
        // ^^^ this
        const name = parent?.childForFieldName("name")
        if (!parent || !name) return false

        // prettier-ignore
        return (
            parent.type === "field" ||
            parent.type === "parameter" ||
            parent.type === "storage_variable" ||
            parent.type === "let_statement" ||
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
            if (qualifier.node.type === "identifier") {
                const resolved = Reference.resolve(new NamedNode(qualifier.node, qualifier.file))
                if (resolved instanceof Struct || resolved instanceof Message) {
                    // found `Foo.fromCell` case
                    const prefix = resolved instanceof Struct ? "AnyStruct_" : "AnyMessage_"

                    const fromCellName = prefix + "fromCell"
                    const fromCell = index.elementByName(IndexKey.Funs, fromCellName)
                    if (fromCell) {
                        const newState = state.withValue(
                            "search-name",
                            prefix + this.element.name(),
                        )
                        if (!proc.execute(fromCell, newState)) return false
                    }

                    const fromSliceName = prefix + "fromSlice"
                    const fromSlice = index.elementByName(IndexKey.Funs, fromSliceName)
                    if (fromSlice) {
                        const newState = state.withValue(
                            "search-name",
                            prefix + this.element.name(),
                        )
                        if (!proc.execute(fromSlice, newState)) return false
                    }

                    const opcodeName = prefix + "opcode"
                    const opcode = index.elementByName(IndexKey.Funs, opcodeName)
                    if (opcode) {
                        const newState = state.withValue(
                            "search-name",
                            prefix + this.element.name(),
                        )
                        if (!proc.execute(opcode, newState)) return false
                    }

                    return true
                }
            }

            const methodRef = qualifier.node.parent?.type === "method_call_expression"

            const nodeStruct = index.elementByName(IndexKey.Primitives, "AnyStruct")
            if (nodeStruct && (methodRef || state.get("completion"))) {
                const structPrimitiveTy = new PrimitiveTy("AnyStruct", nodeStruct, null)
                if (!this.processType(qualifier, structPrimitiveTy, proc, state)) return false
            }
            const nodeMessage = index.elementByName(IndexKey.Primitives, "AnyMessage")
            if (nodeMessage && (methodRef || state.get("completion"))) {
                const messagePrimitiveTy = new PrimitiveTy("AnyMessage", nodeMessage, null)
                if (!this.processType(qualifier, messagePrimitiveTy, proc, state)) return false
            }
        }

        if (qualifierType instanceof BouncedTy) {
            return this.processType(qualifier, qualifierType.innerTy, proc, state)
        }

        if (!this.processType(qualifier, qualifierType, proc, state)) return false

        // process unwrapped T? later to correctly resolve in case of the same name method for T and T?
        if (qualifierType instanceof OptionTy) {
            // show completion and resolve without explicit unwrapping
            return this.processType(qualifier, qualifierType.innerTy, proc, state)
        }

        // last resort, trying to find methods of T?
        return this.processType(qualifier, new OptionTy(qualifierType), proc, state)
    }

    private processType(
        qualifier: Expression,
        qualifierType: Ty | StructTy | MessageTy | TraitTy | ContractTy,
        proc: ScopeProcessor,
        state: ResolveState,
    ): boolean {
        const methodRef = qualifier.node.parent?.type === "method_call_expression"

        // Traits or contracts
        if (qualifierType instanceof StorageMembersOwnerTy) {
            // for `foo.bar()` first check for methods since there are no callable types
            // for `foo.bar` first check for fields since there are no function pointers
            if (methodRef) {
                if (!Reference.processNamedEls(proc, state, qualifierType.methods())) return false
                if (!Reference.processNamedEls(proc, state, qualifierType.fields())) return false
                if (!Reference.processNamedEls(proc, state, qualifierType.constants())) return false
            } else {
                if (!Reference.processNamedEls(proc, state, qualifierType.fields())) return false
                if (!Reference.processNamedEls(proc, state, qualifierType.constants())) return false
                if (!Reference.processNamedEls(proc, state, qualifierType.methods())) return false
            }
        }

        if (qualifierType instanceof StructTy) {
            if (!Reference.processNamedEls(proc, state, qualifierType.fields())) return false
        }

        if (qualifierType instanceof MessageTy) {
            if (!Reference.processNamedEls(proc, state, qualifierType.fields())) return false
        }

        return this.processTypeMethods(qualifierType, proc, state)
    }

    private processTypeMethods(ty: Ty, proc: ScopeProcessor, state: ResolveState): boolean {
        const tyName = ty.qualifiedName()
        return index.processElementsByKey(
            IndexKey.Methods,
            new (class implements ScopeProcessor {
                public execute(fun: Fun, state: ResolveState): boolean {
                    const selfParam = fun.parameters()[0]
                    const typeNode = selfParam.node.childForFieldName("type")
                    if (typeNode === null) return true

                    const isOptional = typeNode.nextSibling?.text === "?"
                    if (Reference.typeMatches(ty, tyName, isOptional, typeNode)) {
                        return proc.execute(fun, state)
                    }

                    return true
                }
            })(),
            state,
        )
    }

    private static typeMatches(
        ty: Ty,
        tyName: string,
        isOptional: boolean,
        typeNode: SyntaxNode,
    ): boolean {
        if (typeNode.type === "map_type") {
            return ty instanceof MapTy
        }
        if (isOptional) {
            return ty instanceof OptionTy && ty.innerTy.name() === typeNode.text
        }
        return tyName === typeNode.text
    }

    private processUnqualifiedResolve(proc: ScopeProcessor, state: ResolveState): boolean {
        const name = this.element.node.text
        if (!name || name === "" || name === "_") return true

        if (name === "self") {
            const ownerNode = this.element.parentOfType("contract", "trait")
            if (ownerNode !== undefined) {
                const constructor = ownerNode.type === "contract" ? Contract : Trait
                const owner = new constructor(ownerNode, this.element.file)

                if (!proc.execute(owner, state.withValue("search-name", owner.name()))) {
                    return false
                }
            }
        }

        if (state.get("completion")) {
            const ownerNode = this.element.parentOfType(
                "contract_body",
                "trait_body",
                "global_function",
            )

            // inside a trait/contract, when we write `foo`, we want to automatically complete it
            // with `self.foo` if there are any methods/fields/constants with the same name
            if (ownerNode?.type === "contract_body" || ownerNode?.type === "trait_body") {
                if (!this.processContractTraitSelfCompletion(ownerNode, state, proc)) return false
            }

            // inside extends function, when we write `foo`, we want to automatically complete it
            // with `self.foo` if there are any methods/fields/constants with the same name
            if (ownerNode?.type === "global_function") {
                if (!this.processExtendsMethodSelfCompletion(ownerNode, state, proc)) return false
            }
        }

        if (this.element.node.type === "tvm_instruction") {
            // don't try to resolve TVM assembly
            return true
        }

        const parent = this.element.node.parent
        if (parent?.type === "instance_argument") {
            // `Foo { name: "" }`
            //        ^^^^^^^^ this
            if (!this.resolveInstanceInitField(parent, proc, state)) return false
        }
        if (parent?.type === "destruct_bind") {
            // `let Foo { name } = foo()`
            //            ^^^^ this
            if (!this.resolveDestructField(parent, proc, state)) return false
        }

        if (this.element.node.type === "initOf" && this.element.node.text === "initOf") {
            const resolved = Reference.resolveInitOf(this.element.node, this.element.file)
            if (resolved) {
                if (!proc.execute(resolved, state.withValue("search-name", "init"))) return false
            }
        }

        if (parent?.type === "asm_arrangement_args") {
            // `asm(cell self) extends fun storeRef(self: Builder, cell: Cell): Builder`
            //           ^^^^ this
            return this.resolveAsmArrangementArgs(parent, proc, state)
        }

        if (parent?.type === "static_call_expression") {
            // let context = context();
            // context();
            // ^^^^^^^ resolve only as global symbol
            return this.processAllEntities(proc, state)
        }

        if (!this.processBlock(proc, state)) return false

        return this.processAllEntities(proc, state)
    }

    private processContractTraitSelfCompletion(
        ownerNode: SyntaxNode,
        state: ResolveState,
        proc: ScopeProcessor,
    ): boolean {
        const constructor = ownerNode.type === "contract_body" ? Contract : Trait
        const parent = ownerNode.parent
        if (!parent) return true

        const owner = new constructor(parent, this.element.file)
        const typeConstructor = ownerNode.type === "contract_body" ? ContractTy : TraitTy
        const ownerTy = new typeConstructor(owner.name(), owner)
        const expr = new Expression(this.element.node, this.element.file)

        const newState = state.withValue("prefix", "self.")
        return this.processType(expr, ownerTy, proc, newState)
    }

    private processExtendsMethodSelfCompletion(
        ownerNode: SyntaxNode,
        state: ResolveState,
        proc: ScopeProcessor,
    ): boolean {
        const func = new Fun(ownerNode, this.element.file)
        const selfParam = func.selfParam()
        if (selfParam === null) return true // skip if we are not in extends function

        const selfTy = TypeInferer.inferType(selfParam)
        if (!selfTy) return true
        const expr = new Expression(this.element.node, this.element.file)

        const newState = state.withValue("prefix", "self.")
        return this.processType(expr, selfTy, proc, newState)
    }

    private resolveInstanceInitField(
        parent: SyntaxNode,
        proc: ScopeProcessor,
        state: ResolveState,
    ): boolean {
        // resolving `Foo { name: "" }`
        //                  ^^^^ this

        const name = parent.childForFieldName("name")
        if (!name) return true

        if (!name.equals(this.element.node)) {
            // `Foo { name: "" }`
            //        ^^^^ this should be our identifier to resolve
            return true
        }

        const value = parent.childForFieldName("value")
        if (!value && name.nextSibling?.text !== ":") {
            // `Foo { name }`
            //            ^ no value and `:`
            return true
        }

        // `Foo { name: "" }`
        //  ^^^^^^^^^^^^^^^^ this
        const instanceExpr = parent.parent?.parent
        if (!instanceExpr) return true

        // `Foo { name: "" }`
        //  ^^^ this
        const typeExpr = instanceExpr.childForFieldName("name")
        if (!typeExpr) return true

        const resolvedType = Reference.resolve(new NamedNode(typeExpr, this.element.file))
        if (!resolvedType) return true
        if (!(resolvedType instanceof FieldsOwner)) return true

        for (const field of resolvedType.fields()) {
            if (!proc.execute(field, state)) return false
        }
        return true
    }

    private resolveDestructField(
        parent: SyntaxNode,
        proc: ScopeProcessor,
        state: ResolveState,
    ): boolean {
        // resolving `let Foo { name } = foo()`
        //                      ^^^^ this

        const name = parent.childForFieldName("name")
        if (!name) return true

        // `let Foo { name } = foo()`
        //  ^^^^^^^^^^^^^^^^^^^^^^^^ this
        const destructStatement = parent.parent?.parent
        if (!destructStatement) return true

        // `let Foo { name } = foo()`
        //      ^^^ this
        const typeExpr = destructStatement.childForFieldName("name")
        if (!typeExpr) return true

        // `let Foo { name: bindName } = foo()`
        //                  ^^^^^^^^ this
        const bindName = parent.childForFieldName("bind")

        // `let Foo { name: bindName } = foo()`
        //            ^^^^^ resolve this as field
        if ((bindName && name.equals(this.element.node)) || state.get("completion")) {
            const resolvedType = Reference.resolve(new NamedNode(typeExpr, this.element.file))
            if (!resolvedType) return true
            if (!(resolvedType instanceof FieldsOwner)) return true

            for (const field of resolvedType.fields()) {
                if (!proc.execute(field, state)) return false
            }
            return true
        }

        return true
    }

    public static findDestructField(
        bindNode: SyntaxNode,
        file: TactFile,
        name: string,
    ): Field | null {
        // `let Foo { name } = foo()`
        //  ^^^^^^^^^^^^^^^^^^^^^^^^ this
        const destructStatement = bindNode.parent?.parent
        if (!destructStatement) return null

        // `let Foo { name } = foo()`
        //      ^^^ this
        const typeExpr = destructStatement.childForFieldName("name")
        if (!typeExpr) return null

        const resolvedType = Reference.resolve(new NamedNode(typeExpr, file))
        if (!resolvedType) return null
        if (!(resolvedType instanceof FieldsOwner)) return null

        for (const field of resolvedType.fields()) {
            if (field.name() === name) {
                return field
            }
        }

        return null
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
        const file = this.element.file

        if (state.get("completion")) {
            const processor = new (class implements ScopeProcessor {
                public execute(node: TactNode, state: ResolveState): boolean {
                    if (!(node instanceof Fun)) return true
                    if (node.withSelf()) return true // don't add methods to unqualified completion
                    if (
                        node.name().startsWith("AnyStruct_") ||
                        node.name().startsWith("AnyMessage_")
                    ) {
                        // this functions in fact static methods
                        return true
                    }
                    return proc.execute(node, state)
                }
            })()

            if (!index.processElsByKeyAndFile(IndexKey.Funs, file, processor, state)) return false
            if (!index.processElsByKeyAndFile(IndexKey.Primitives, file, proc, state)) return false
            if (!index.processElsByKeyAndFile(IndexKey.Structs, file, proc, state)) return false
            if (!index.processElsByKeyAndFile(IndexKey.Messages, file, proc, state)) return false
            if (!index.processElsByKeyAndFile(IndexKey.Traits, file, proc, state)) return false
            if (!index.processElsByKeyAndFile(IndexKey.Constants, file, proc, state)) return false
            return index.processElsByKeyAndFile(IndexKey.Contracts, file, proc, state)
        }

        // fast path, check the current file
        const fileIndex = index.findFile(file.uri)
        if (fileIndex && !this.processElsInIndex(proc, state, fileIndex)) return false

        // if not found, check all imported files
        for (const importedFile of file.importedFiles()) {
            const fileIndex = index.findFile(filePathToUri(importedFile))
            if (!fileIndex) continue
            if (!this.processElsInIndex(proc, state, fileIndex)) return false
        }

        if (this.element.node.text === "sha256") {
            // sha256 is a special builtin function with two signatures,
            // so we need extra logic to resolve it correctly
            if (!this.resolveSha256(proc, state)) return false
        }

        // If not found in the workspace, search in stdlib and stubs
        if (index.stdlibRoot) {
            if (!this.processElsInIndex(proc, state, index.stdlibRoot)) return false
        }

        if (index.stubsRoot) {
            if (!this.processElsInIndex(proc, state, index.stubsRoot)) return false
        }

        // as a last resort process all imports tree
        const visited: Set<string> = new Set([file.uri])
        const queue: string[] = file.importedFiles()

        while (queue.length > 0) {
            const path = queue.shift()
            if (!path) continue
            if (visited.has(path)) continue
            visited.add(path)

            const file = ImportResolver.toFile(path)
            if (!file) continue

            const fileIndex = index.findFile(filePathToUri(path))
            if (!fileIndex) continue

            if (!this.processElsInIndex(proc, state, fileIndex)) continue

            queue.push(...file.importedFiles())
        }

        return true
    }

    private resolveSha256(proc: ScopeProcessor, state: ResolveState): boolean {
        // We need to resolve `sha256("hello")` to `sha256` declaration with `String` argument.
        // sha256("hello")
        // ^^^^^^

        const definitions = this.findSha256Definitions()
        if (!definitions) {
            return true
        }

        // sha256("hello")
        // ^^^^^^^^^^^^^^^
        const callNode = this.element.node.parent
        if (callNode?.type !== "static_call_expression") {
            // some odd reference?
            return true
        }

        const call = new CallLike(callNode, this.element.file)

        // sha256("hello")
        //        ^^^^^^^^
        const arg = call.arguments().at(0)
        if (!arg) {
            // incomplete call
            return true
        }

        const argType = new Expression(arg, this.element.file).type()
        if (argType?.name() !== "String") {
            // use the default resolver which resolved `sha256`
            // to the version with the `Slice` argument
            return true
        }

        const stringSha256 = definitions.find(it => {
            const param = it.parameters().at(0)
            if (!param) return false
            const paramType = TypeInferer.inferType(param)
            return paramType?.name() === "String"
        })

        if (stringSha256) {
            return proc.execute(stringSha256, state)
        }

        return true
    }

    private findSha256Definitions(): Fun[] | undefined {
        const stdlibRoot = index.stdlibRoot
        if (stdlibRoot) {
            // stdlib in the latest Tact versions contains stubs.tact, so looking here first
            const def = stdlibRoot.elementsByName(IndexKey.Funs, "sha256")
            if (def.length > 0) {
                return def
            }
        }
        const stubsRoot = index.stubsRoot
        if (stubsRoot) {
            // and fallback to embedded stubs
            const def = stubsRoot.elementsByName(IndexKey.Funs, "sha256")
            if (def.length > 0) {
                return def
            }
        }
        return undefined
    }

    private processElsInIndex(
        proc: ScopeProcessor,
        state: ResolveState,
        fileIndex: IndexFinder,
    ): boolean {
        if (!fileIndex.processElementsByKey(IndexKey.Funs, proc, state)) return false
        if (!fileIndex.processElementsByKey(IndexKey.Primitives, proc, state)) return false
        if (!fileIndex.processElementsByKey(IndexKey.Structs, proc, state)) return false
        if (!fileIndex.processElementsByKey(IndexKey.Messages, proc, state)) return false
        if (!fileIndex.processElementsByKey(IndexKey.Traits, proc, state)) return false
        if (!fileIndex.processElementsByKey(IndexKey.Constants, proc, state)) return false
        return fileIndex.processElementsByKey(IndexKey.Contracts, proc, state)
    }

    public processBlock(proc: ScopeProcessor, state: ResolveState): boolean {
        const file = this.element.file
        let descendant: SyntaxNode | null = this.element.node

        let startStatement: SyntaxNode | null = null

        while (descendant) {
            // walk all variables inside block
            if (descendant.type === "block_statement" || descendant.type === "function_body") {
                const statements = descendant.children
                for (const stmt of statements) {
                    if (!stmt) break

                    // reached the starting statement, look no further
                    if (startStatement && stmt.equals(startStatement)) break
                    if (stmt.type === "let_statement") {
                        // let name = expr;
                        //     ^^^^ this
                        const name = stmt.childForFieldName("name")
                        if (name === null) break
                        if (!proc.execute(new NamedNode(name, file), state)) return false
                    }

                    if (stmt.type === "destruct_statement") {
                        // let Foo { name, other: value } = foo()
                        //         ^^^^^^^^^^^^^^^^^^^^^^ this
                        const bindList = stmt.childForFieldName("binds")
                        if (!bindList) break

                        // let Foo { name, other: value } = foo()
                        //           ^^^^^ ^^^^^^^^^^^^ this
                        const bindings = bindList.children
                            .filter(it => it?.type === "destruct_bind")
                            .filter(it => it !== null)

                        for (const bind of bindings) {
                            // let Foo { name, other: value } = foo()
                            //                        ^^^^^
                            // or
                            // let Foo { name, other: value } = foo()
                            //           ^^^^
                            const actualName =
                                bind.childForFieldName("bind") ?? bind.childForFieldName("name")

                            if (
                                actualName &&
                                !proc.execute(new NamedNode(actualName, file), state)
                            ) {
                                return false
                            }
                        }
                    }
                }
            }

            if (descendant.type === "foreach_statement") {
                // foreach (key, value in expr)
                //          ^^^ this
                const key = descendant.childForFieldName("key")
                if (key === null) {
                    descendant = descendant.parent
                    continue
                }
                if (!proc.execute(new NamedNode(key, file), state)) return false

                // foreach (key, value in expr)
                //               ^^^^^ this
                const value = descendant.childForFieldName("value")
                if (value === null) {
                    descendant = descendant.parent
                    continue
                }
                if (!proc.execute(new NamedNode(value, file), state)) return false
            }

            if (descendant.type === "catch_clause") {
                const name = descendant.childForFieldName("name")
                if (name === null) {
                    descendant = descendant.parent
                    continue
                }
                if (!proc.execute(new NamedNode(name, file), state)) return false
            }

            // process parameters of function
            if (isFunNode(descendant)) {
                const rawParameters = descendant.childForFieldName("parameters")
                if (rawParameters === null) {
                    const parameter = descendant.childForFieldName("parameter")
                    if (parameter === null) break

                    if (!proc.execute(new NamedNode(parameter, file), state)) return false
                } else {
                    const children = rawParameters.children
                    if (children.length < 2) break
                    const params = children.slice(1, -1)

                    for (const param of params) {
                        if (!param) continue
                        if (!proc.execute(new NamedNode(param, file), state)) return false
                    }
                }
            }

            if (descendant.type === "let_statement" || descendant.type === "expression_statement") {
                startStatement = descendant
            }

            descendant = descendant.parent
        }

        return true
    }

    public static processNamedEls(
        proc: ScopeProcessor,
        state: ResolveState,
        elements: NamedNode[],
    ): boolean {
        for (const element of elements) {
            if (!proc.execute(element, state)) return false
        }
        return true
    }

    private static getQualifier(node: TactNode): Expression | null {
        const parent = node.node.parent
        if (!parent) {
            return null
        }

        if (parent.type === "field_access_expression") {
            const name = parent.childForFieldName("name")
            if (name === null) return null
            if (!name.equals(node.node)) return null
            const qualifier = parent.child(0)
            if (!qualifier) return null
            return new Expression(qualifier, node.file)
        }

        if (parent.type === "method_call_expression") {
            const name = parent.childForFieldName("name")
            if (name === null) return null
            if (!name.equals(node.node)) return null
            const qualifier = parent.child(0)
            if (!qualifier) return null
            return new Expression(qualifier, node.file)
        }

        return null
    }

    private static declarationAstToNode(node: SyntaxNode, file: TactFile): NamedNode {
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
        if (node.type === "storage_function") {
            return new Fun(node, file)
        }
        if (node.type === "let_statement") {
            const name = node.childForFieldName("name")
            if (!name) return new NamedNode(node, file)
            return new NamedNode(name, file)
        }

        return new NamedNode(node, file)
    }

    public static resolveInitOf(node: SyntaxNode, file: TactFile): TactNode | null {
        const actualNode = node.parent
        if (!actualNode) return null
        const name = actualNode.childForFieldName("name")
        if (!name) return null
        const type = TypeInferer.inferType(new TactNode(name, file))
        if (!type) return null
        if (!(type instanceof ContractTy)) return null
        const initFunc = type.initFunction()
        if (!initFunc) {
            // if no init function in the contract, go to the contract name
            if (!type.anchor) return null
            const nameNode = type.anchor.nameNode()
            if (!nameNode) return null
            return new TactNode(nameNode.node, file)
        }

        const initIdent = initFunc.initIdentifier()
        if (!initIdent) return null
        return new TactNode(initIdent, file)
    }
}
