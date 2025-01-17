import {
    BouncedTy,
    ContractTy,
    MapTy,
    MessageTy,
    OptionTy,
    PrimitiveTy,
    StructTy,
    TraitTy,
    Ty,
} from "./types/BaseTy"
import {Expression, NamedNode, Node} from "./psi/Node"
import {Reference} from "./psi/Reference"
import {Struct, Message, Function, Primitive, Contract, Trait} from "./psi/TopLevelDeclarations"
import {isTypeOwnerNode} from "./psi/utils"
import {SyntaxNode} from "web-tree-sitter"
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
        if (node.node.type === "type_identifier") {
            const resolved = Reference.resolve(new NamedNode(node.node, node.file))
            if (resolved === null) return null
            return this.inferTypeFromResolved(resolved)
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
                const value = parent.childForFieldName("value")!
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

            if (isTypeOwnerNode(resolved.node)) {
                const typeNode = resolved.node.childForFieldName("type")!
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

        if (node.node.type === "parenthesized_expression") {
            const inner = node.node.children[1]
            if (!inner) return null
            return this.inferType(new Expression(inner, node.file))
        }

        if (node.node.type === "parameter") {
            return this.inferChildFieldType(node, "name")
        }

        if (node.node.type === "field_access_expression") {
            const name = node.node.childForFieldName("name")
            if (name === null) return null

            const element = new NamedNode(name, node.file)
            const resolved = Reference.resolve(element)
            if (resolved === null) return null

            if (resolved.node.type === "field") {
                const typeNode = resolved.node.childForFieldName("type")!
                return this.inferTypeMaybeOption(typeNode, resolved)
            }

            if (resolved.node.type === "storage_variable") {
                const typeNode = resolved.node.childForFieldName("type")!
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
            if (!(resolved instanceof Function)) return null

            const returnType = resolved.returnType()
            if (returnType === null) return null

            return this.inferType(returnType)
        }

        return null
    }

    private inferTypeMaybeOption(typeNode: SyntaxNode, resolved: NamedNode) {
        const inferred = this.inferType(new Expression(typeNode, resolved.file))
        if (inferred !== null && typeNode.nextSibling?.text === "?") {
            return new OptionTy(inferred)
        }
        return inferred
    }

    private inferTypeFromResolved(resolved: NamedNode): Ty | null {
        if (resolved instanceof Primitive) {
            return new PrimitiveTy(resolved.name(), resolved)
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
