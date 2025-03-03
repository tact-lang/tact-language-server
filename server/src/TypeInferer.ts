import {
    BouncedTy,
    ContractTy,
    MapTy,
    MessageTy,
    NullTy,
    OptionTy,
    PlaceholderTy,
    PrimitiveTy,
    StructTy,
    TraitTy,
    Ty,
} from "./types/BaseTy"
import {CallLike, Expression, NamedNode, Node} from "@server/psi/Node"
import {Reference} from "@server/psi/Reference"
import {Struct, Message, Fun, Primitive, Contract, Trait} from "@server/psi/Decls"
import {isTypeOwnerNode} from "@server/psi/utils"
import type {Node as SyntaxNode} from "web-tree-sitter"
import {CACHE} from "./cache"
import {index, IndexKey} from "./indexes"

export class TypeInferer {
    public static inferType(node: Node): Ty | null {
        return new TypeInferer().inferType(node)
    }

    public inferType(node: Node): Ty | null {
        return CACHE.typeCache.cached(node.node.id, () => this.inferTypeImpl(node))
    }

    private inferTypeImpl(node: Node): Ty | null {
        if (node.node.type === "string") {
            return this.primitiveType("String")
        }

        if (node.node.type === "integer") {
            return this.primitiveType("Int")
        }

        if (node.node.type === "boolean") {
            return this.primitiveType("Bool")
        }

        if (node.node.type === "type_identifier") {
            const resolved = Reference.resolve(new NamedNode(node.node, node.file))
            if (resolved === null) {
                if (
                    node.node.text === "K" ||
                    node.node.text === "V" ||
                    node.node.text === "S" ||
                    node.node.text === "M"
                ) {
                    return new PlaceholderTy(node.node.text, new NamedNode(node.node, node.file))
                }
                return null
            }

            const inferred = this.inferTypeFromResolved(resolved)
            if (
                inferred &&
                !(inferred instanceof OptionTy) &&
                node.node.nextSibling?.text === "?"
            ) {
                return new OptionTy(inferred)
            }
            return inferred
        }

        if (node.node.type === "identifier" || node.node.type === "self") {
            const resolved = Reference.resolve(new NamedNode(node.node, node.file))
            if (resolved === null) return null

            const parent = resolved.node.parent
            if (parent === null) return null

            if (parent.type === "let_statement") {
                const typeHint = parent.childForFieldName("type")
                if (typeHint !== null) {
                    return this.inferTypeMaybeOption(typeHint, resolved)
                }
                const value = parent.childForFieldName("value")
                if (!value) return null
                return this.inferType(new Expression(value, resolved.file))
            }

            if (parent.type === "foreach_statement") {
                const expr = parent.childForFieldName("map")
                if (!expr) return null
                const exprTy = new Expression(expr, node.file).type()
                if (!(exprTy instanceof MapTy)) return null

                const key = parent.childForFieldName("key")
                if (!key) return null

                if (resolved.node.equals(key)) {
                    return exprTy.keyTy
                }

                const value = parent.childForFieldName("value")
                if (!value) return null

                if (resolved.node.equals(value)) {
                    return exprTy.valueTy
                }
            }

            if (parent.type === "catch_clause") {
                return this.primitiveType("Int")
            }

            if (resolved.node.type === "field" || resolved.node.type === "storage_variable") {
                const typeNode = resolved.node.childForFieldName("type")
                if (!typeNode) return null
                return this.inferTypeMaybeTlB(typeNode, resolved)
            }

            if (isTypeOwnerNode(resolved.node)) {
                const typeNode = resolved.node.childForFieldName("type")
                if (!typeNode) return null
                return this.inferTypeMaybeOption(typeNode, resolved)
            }

            return this.inferTypeFromResolved(resolved)
        }

        if (node.node.type === "bounced_type") {
            const innerTy = this.inferChildFieldType(node, "message")
            if (innerTy === null) return null
            return new BouncedTy(innerTy)
        }

        if (node.node.type === "map_type") {
            const keyTy = this.inferChildFieldType(node, "key")
            if (keyTy === null) return null

            const valueTy = this.inferChildFieldType(node, "value")
            if (valueTy === null) return null

            if (keyTy instanceof PrimitiveTy) {
                const tlb = node.node.childForFieldName("tlb_key")
                const tlbType = tlb?.childForFieldName("type")
                if (tlbType) {
                    keyTy.tlb = tlbType.text
                }
            }

            if (valueTy instanceof PrimitiveTy) {
                const tlb = node.node.childForFieldName("tlb_value")
                const tlbType = tlb?.childForFieldName("type")
                if (tlbType) {
                    valueTy.tlb = tlbType.text
                }
            }

            return new MapTy(keyTy, valueTy)
        }

        if (node.node.type === "instance_expression") {
            const name = node.node.childForFieldName("name")
            if (name === null) return null

            const element = new NamedNode(name, node.file)
            const resolved = Reference.resolve(element)
            if (resolved === null) return null
            return this.inferTypeFromResolved(resolved)
        }

        if (node.node.type === "non_null_assert_expression") {
            const inferred = this.inferChildFieldType(node, "argument")
            if (inferred instanceof OptionTy) {
                return inferred.innerTy
            }
            return inferred
        }

        if (node.node.type === "initOf") {
            const stateInit = index.elementByName(IndexKey.Structs, "StateInit")
            if (!stateInit) return null
            return new StructTy("StateInit", stateInit)
        }

        if (node.node.type === "codeOf") {
            const cell = index.elementByName(IndexKey.Primitives, "Cell")
            if (!cell) return null
            return new PrimitiveTy("Cell", cell, null)
        }

        if (node.node.type === "parenthesized_expression") {
            const inner = node.node.children[1]
            if (!inner) return null
            return this.inferType(new Expression(inner, node.file))
        }

        if (node.node.type === "parameter") {
            return this.inferChildFieldType(node, "type")
        }

        if (node.node.type === "field_access_expression") {
            const name = node.node.childForFieldName("name")
            if (name === null) return null

            const element = new NamedNode(name, node.file)
            const resolved = Reference.resolve(element)
            if (resolved === null) return null

            if (resolved.node.type === "field") {
                const typeNode = resolved.node.childForFieldName("type")
                if (!typeNode) return null
                return this.inferTypeMaybeOption(typeNode, resolved)
            }

            if (resolved.node.type === "storage_variable") {
                const typeNode = resolved.node.childForFieldName("type")
                if (!typeNode) return null
                return this.inferTypeMaybeOption(typeNode, resolved)
            }

            if (resolved.node.type === "storage_constant") {
                const typeNode = resolved.node.childForFieldName("type")
                if (!typeNode) return null
                return this.inferTypeMaybeOption(typeNode, resolved)
            }

            if (resolved.node.type === "parameter") {
                const typeNode = resolved.node.childForFieldName("type")
                if (!typeNode) return null
                return this.inferTypeMaybeOption(typeNode, resolved)
            }

            return this.inferTypeFromResolved(resolved)
        }

        if (
            node.node.type === "static_call_expression" ||
            node.node.type === "method_call_expression"
        ) {
            const name = node.node.childForFieldName("name")
            if (name === null) return null

            const element = new NamedNode(name, node.file)
            const resolved = Reference.resolve(element)
            if (resolved === null) return null
            if (!(resolved instanceof Fun)) return null
            const calledName = resolved.name()

            const returnType = resolved.returnType()
            if (returnType === null) return null
            const type = this.inferTypeMaybeOption(returnType.node, returnType)
            if (!type) return null

            const qualifier = node.node.childForFieldName("object")

            // Handle `Struct.fromCell()` calls
            if (
                qualifier &&
                (calledName.startsWith("AnyStruct_") || calledName.startsWith("AnyMessage_"))
            ) {
                return new Expression(qualifier, node.file).type()
            }

            // following code is completely garbage, we need to replace it with actual generics
            if (
                type instanceof PlaceholderTy ||
                (type instanceof OptionTy && type.innerTy instanceof PlaceholderTy)
            ) {
                const innerTy = type instanceof OptionTy ? type.innerTy : type

                const call = new CallLike(node.node, node.file)
                const selfArgument =
                    node.node.type === "method_call_expression"
                        ? call.node.childForFieldName("object")
                        : call.rawArguments()[0]
                if (!selfArgument) return type

                const selfType = this.inferType(new Expression(selfArgument, node.file))
                if (!selfType) return type
                if (!(selfType instanceof MapTy)) return type

                const resultType =
                    innerTy.name() === "K"
                        ? selfType.keyTy
                        : innerTy.name() === "V"
                          ? selfType.valueTy
                          : null
                if (!resultType) return type

                if (type instanceof OptionTy) {
                    return new OptionTy(resultType)
                }
                return resultType
            }

            return type
        }

        if (node.node.type === "null") {
            return new NullTy()
        }

        if (node.node.type === "unary_expression") {
            const operator = node.node.childForFieldName("operator")?.text
            const argument = node.node.childForFieldName("argument")
            if (!argument) return null

            const argType = this.inferType(new Expression(argument, node.file))
            if (!argType) return null

            if (operator === "!") {
                return this.primitiveType("Bool")
            }
            if (operator === "-") {
                return this.primitiveType("Int")
            }
            return argType
        }

        if (node.node.type === "binary_expression") {
            const operator = node.node.children[1]?.text
            const left = node.node.children[0]
            const right = node.node.children[2]
            if (!operator || !left || !right) return null

            const leftType = this.inferType(new Expression(left, node.file))
            const rightType = this.inferType(new Expression(right, node.file))
            if (!leftType || !rightType) return null

            if (operator === "&&" || operator === "||") {
                return this.primitiveType("Bool")
            }

            if (["+", "-", "*", "/", "%", "<<", ">>", "&", "|", "^"].includes(operator)) {
                if (
                    leftType instanceof PrimitiveTy &&
                    leftType.name() === "String" &&
                    operator === "+"
                ) {
                    return this.primitiveType("String")
                }
                return this.primitiveType("Int")
            }

            if (["<", ">", "<=", ">=", "==", "!="].includes(operator)) {
                return this.primitiveType("Bool")
            }

            return leftType
        }

        if (node.node.type === "ternary_expression") {
            const consequent = node.node.childForFieldName("consequence")
            const alternate = node.node.childForFieldName("alternative")
            if (!consequent || !alternate) return null

            const trueType = this.inferType(new Expression(consequent, node.file))
            const falseType = this.inferType(new Expression(alternate, node.file))
            if (!falseType) return trueType
            if (!trueType) return falseType

            if (trueType instanceof NullTy) {
                return new OptionTy(falseType)
            }

            if (falseType instanceof NullTy) {
                return new OptionTy(trueType)
            }

            return trueType
        }

        if (node instanceof NamedNode) {
            return this.inferTypeFromResolved(node)
        }

        return null
    }

    private primitiveType(name: string): PrimitiveTy | null {
        const node = index.elementByName(IndexKey.Primitives, name)
        if (!node) return null
        return new PrimitiveTy(name, node, null)
    }

    private inferTypeMaybeOption(typeNode: SyntaxNode, resolved: Node): Ty | null {
        const inferred = this.inferType(new Expression(typeNode, resolved.file))
        if (inferred && !(inferred instanceof OptionTy) && typeNode.nextSibling?.text === "?") {
            return new OptionTy(inferred)
        }
        return inferred
    }

    private inferTypeMaybeTlB(typeNode: SyntaxNode, resolved: Node): Ty | null {
        const inferredType = this.inferTypeMaybeOption(typeNode, resolved)
        if (inferredType instanceof PrimitiveTy) {
            const tlb = resolved.node.childForFieldName("tlb")
            const tlbType = tlb?.childForFieldName("type")
            if (tlbType) {
                inferredType.tlb = tlbType.text
            }
        }
        return inferredType
    }

    private inferTypeFromResolved(resolved: NamedNode): Ty | null {
        if (resolved instanceof Primitive) {
            return new PrimitiveTy(resolved.name(), resolved, null)
        }
        if (resolved instanceof Struct) {
            return new StructTy(resolved.name(), resolved)
        }
        if (resolved instanceof Message) {
            return new MessageTy(resolved.name(), resolved)
        }
        if (resolved instanceof Trait) {
            return new TraitTy(resolved.name(), resolved)
        }
        if (resolved instanceof Contract) {
            return new ContractTy(resolved.name(), resolved)
        }
        return null
    }

    private inferChildFieldType(node: Node, fieldName: string): Ty | null {
        const child = node.node.childForFieldName(fieldName)
        if (!child) return null
        return this.inferType(new Expression(child, node.file))
    }
}
