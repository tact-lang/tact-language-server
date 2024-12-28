import {File, Node, Reference} from "./reference";
import {PrimitiveTy, StructTy, Ty} from "./types/BaseTy";

export class TypeInferer {
    inferType(node: Node): Ty | null {
        if (node.node.type == "string") {

        }

        if (node.node.type == "type_identifier") {
            const nameRef = new Reference(node)
            const resolved = nameRef.resolve()
            if (resolved == null) return null;

            if (resolved.node.type === 'primitive') {
                return new PrimitiveTy(resolved.name(), resolved)
            }

            return new StructTy(resolved.name(), resolved)
        }

        if (node.node.type == "identifier") {
            const nameRef = new Reference(node)

            const resolved = nameRef.resolve()
            if (resolved == null) return null;

            const parent = resolved.node.parent;
            if (parent == null) return null;

            if (parent.type == "let_statement") {
                const value = parent.childForFieldName('value')!!
                return this.inferType(new Node(value, resolved.file))
            }

            if (resolved.node.type == "field") {
                const typeNode = resolved.node.childForFieldName("type")!!
                return this.inferType(new Node(typeNode, resolved.file))
            }

            if (resolved.node.type === 'primitive') {
                return new PrimitiveTy(resolved.name(), resolved)
            }

            return new StructTy(resolved.name(), resolved)
        }

        if (node.node.type == "instance_expression") {
            const name = node.node.childForFieldName("name")
            if (name == null) return null;

            const element = new Node(name, node.file)
            const nameRef = new Reference(element)

            const resolved = nameRef.resolve()
            if (resolved == null) return null;

            return new StructTy(resolved.name(), resolved)
        }

        if (node.node.type == "field_access_expression") {
            const name = node.node.childForFieldName("name")
            if (name == null) return null;

            const element = new Node(name, node.file)
            const nameRef = new Reference(element)

            const resolved = nameRef.resolve()
            if (resolved == null) return null;

            if (resolved.node.type == "field") {
                const typeNode = resolved.node.childForFieldName("type")!!
                return this.inferType(new Node(typeNode, resolved.file))
            }

            return new StructTy(resolved.name(), resolved)
        }

        return null
    }
}