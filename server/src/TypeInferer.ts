import {MessageTy, PrimitiveTy, StructTy, Ty} from "./types/BaseTy";
import {Expression, NamedNode, Node} from "./psi/Node";
import {Reference} from "./psi/Reference";
import {Struct, Message, Function, Primitive} from "./psi/TopLevelDeclarations";

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

            if (resolved instanceof Primitive) {
                return new PrimitiveTy(resolved.name(), resolved)
            }
        }

        if (node.node.type === "identifier") {
            const resolved = Reference.resolve(new NamedNode(node.node, node.file))
            if (resolved === null) return null

            const parent = resolved.node.parent;
            if (parent === null) return null

            if (parent.type === "let_statement") {
                const value = parent.childForFieldName('value')!
                return this.inferType(new Expression(value, resolved.file))
            }

            if (resolved.node.type === "field") {
                const typeNode = resolved.node.childForFieldName("type")!
                return this.inferType(new Expression(typeNode, resolved.file))
            }

            if (resolved.node.type === "parameter") {
                const typeNode = resolved.node.childForFieldName("type")!
                return this.inferType(new Expression(typeNode, resolved.file))
            }

            if (resolved.node.type === "global_constant") {
                const typeNode = resolved.node.childForFieldName("type")!
                return this.inferType(new Expression(typeNode, resolved.file))
            }

            if (resolved.node.type === 'primitive') {
                return new PrimitiveTy(resolved.name(), resolved)
            }

            if (resolved instanceof Struct) {
                return new StructTy(resolved.name(), resolved)
            }

            if (resolved instanceof Message) {
                return new MessageTy(resolved.name(), resolved)
            }
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
                return this.inferType(new Expression(typeNode, resolved.file))
            }

            if (resolved instanceof Struct) {
                return new StructTy(resolved.name(), resolved)
            }

            if (resolved instanceof Message) {
                return new MessageTy(resolved.name(), resolved)
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
}
