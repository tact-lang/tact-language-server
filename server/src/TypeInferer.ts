import {BouncedTy, ContractTy, MessageTy, OptionTy, PrimitiveTy, StructTy, TraitTy, Ty} from "./types/BaseTy";
import {Expression, NamedNode, Node} from "./psi/Node";
import {Reference} from "./psi/Reference";
import {Struct, Message, Function, Primitive, Contract, Trait} from "./psi/TopLevelDeclarations";
import {isTypeOwnerNode} from "./psi/utils";
import {SyntaxNode} from "web-tree-sitter";

export class TypeInferer {
    public static inferType(node: Node): Ty | null {
        return new TypeInferer().inferType(node);
    }

    public inferType(node: Node): Ty | null {
        if (node.node.type === "type_identifier") {
            const resolved = Reference.resolve(new NamedNode(node.node, node.file))
            if (resolved === null) return null

            if (resolved.node.type === 'primitive') {
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

            if (resolved instanceof Primitive) {
                return new PrimitiveTy(resolved.name(), resolved)
            }

            if (resolved instanceof Contract) {
                return new ContractTy(resolved.name(), resolved)
            }
        }

        if (node.node.type === "identifier" || node.node.type === "self") {
            const resolved = Reference.resolve(new NamedNode(node.node, node.file))
            if (resolved === null) return null

            const parent = resolved.node.parent;
            if (parent === null) return null

            if (parent.type === "let_statement") {
                const typeHint = parent.childForFieldName('type')
                if (typeHint !== null) {
                    return this.inferTypeMaybeOption(typeHint, resolved);
                }
                const value = parent.childForFieldName('value')!
                return this.inferType(new Expression(value, resolved.file))
            }

            if (isTypeOwnerNode(resolved.node)) {
                const typeNode = resolved.node.childForFieldName("type")!
                return this.inferTypeMaybeOption(typeNode, resolved);
            }

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
        }

        if (node.node.type === "bounced_type") {
            const message = node.node.childForFieldName("message")
            if (!message) return null

            const innerTy = this.inferType(new Expression(message, node.file))
            if (innerTy === null) return null

            return new BouncedTy(innerTy)
        }

        if (node.node.type === "instance_expression") {
            const name = node.node.childForFieldName("name")
            if (name === null) return null

            const element = new NamedNode(name, node.file)
            const resolved = Reference.resolve(element)
            if (resolved === null) return null

            if (resolved instanceof Struct) {
                return new StructTy(resolved.name(), resolved)
            }

            if (resolved instanceof Message) {
                return new MessageTy(resolved.name(), resolved)
            }
        }

        if (node.node.type === "non_null_assert_expression") {
            const arg = node.node.childForFieldName("argument")
            if (arg === null) return null
            const inferred = this.inferType(new Expression(arg, node.file))
            if (inferred instanceof OptionTy) {
                return inferred.innerTy
            }
            return inferred
        }

        if (node.node.type === "initOf") {
            // TODO: return StateInit
        }

        if (node.node.type === "parenthesized_expression") {
            const inner = node.node.children[1]
            if (!inner) return null
            return this.inferType(new Expression(inner, node.file))
        }

        if (node.node.type === "parameter") {
            const name = node.node.childForFieldName("name")
            if (name === null) return null
            return this.inferType(new Expression(name, node.file))
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

            if (resolved instanceof Struct) {
                return new StructTy(resolved.name(), resolved)
            }

            if (resolved instanceof Message) {
                return new MessageTy(resolved.name(), resolved)
            }

            if (resolved instanceof Trait) {
                return new TraitTy(resolved.name(), resolved)
            }
        }

        if (node.node.type === "static_call_expression" || node.node.type === "method_call_expression") {
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
        if (inferred !== null && typeNode.nextSibling?.text === '?') {
            return new OptionTy(inferred)
        }
        return inferred
    }
}
