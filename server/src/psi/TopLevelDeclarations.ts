import {Expression, NamedNode} from "./Node"
import {Reference} from "./Reference"
import {index, IndexKey} from "../indexes"

export class FieldsOwner extends NamedNode {
    public fields(): NamedNode[] {
        const body = this.node.childForFieldName("body")
        if (!body) return []
        return body.children
            .filter(value => value.type === "field")
            .map(value => new NamedNode(value, this.file))
    }
}

export class Message extends FieldsOwner {}

export class Struct extends FieldsOwner {}

export class Primitive extends NamedNode {}

export class StorageMembersOwner extends NamedNode {
    public ownMethods(): Function[] {
        const body = this.node.childForFieldName("body")
        if (!body) return []
        return body.children
            .filter(value => value.type === "storage_function")
            .map(value => new Function(value, this.file))
    }

    public ownFields(): NamedNode[] {
        const body = this.node.childForFieldName("body")
        if (!body) return []
        return body.children
            .filter(value => value.type === "storage_variable")
            .map(value => new NamedNode(value, this.file))
    }

    public ownConstants(): Constant[] {
        const body = this.node.childForFieldName("body")
        if (!body) return []
        return body.children
            .filter(value => value.type === "storage_constant")
            .map(value => new Constant(value, this.file))
    }

    public methods(): Function[] {
        const own = this.ownMethods()
        const inherited = this.inheritTraits().flatMap(trait => trait.methods())
        return [...own, ...inherited]
    }

    public fields(): NamedNode[] {
        const own = this.ownFields()
        const inherited = this.inheritTraits().flatMap(trait => trait.fields())
        return [...own, ...inherited]
    }

    public inheritTraits(): Trait[] {
        if (this.name() === "BaseTrait") {
            return []
        }

        const baseTraitNode = index.elementByName(IndexKey.Traits, "BaseTrait")

        const traitList = this.node.childForFieldName("traits")
        const baseTraitOrEmpty =
            baseTraitNode !== null ? [new Trait(baseTraitNode.node, baseTraitNode.file)] : []

        if (!traitList) {
            return [...baseTraitOrEmpty]
        }

        const inheritTraits = traitList.children
            .filter(value => value.type === "identifier")
            .map(value => new NamedNode(value, this.file))
            .map(node => Reference.resolve(node))
            .filter(node => node !== null)
            .map(node => (node instanceof Trait ? node : new Trait(node.node, node.file)))

        return [...inheritTraits, ...baseTraitOrEmpty]
    }
}

export class Trait extends StorageMembersOwner {}

export class Contract extends StorageMembersOwner {}

export class Function extends NamedNode {
    public returnType(): Expression | null {
        const result = this.node.childForFieldName("result")
        if (!result) return null
        if (result.text === ":") {
            // some weird bug
            return new Expression(result.nextSibling!, this.file)
        }
        return new Expression(result, this.file)
    }

    public parameters(): NamedNode[] {
        const parametersNode = this.node.childForFieldName("parameters")
        if (!parametersNode) return []

        return parametersNode.children
            .filter(value => value.type === "parameter")
            .map(value => new NamedNode(value, this.file))
    }

    public withSelf(): boolean {
        const params = this.parameters()
        if (params.length === 0) return false
        const first = params[0]
        return first.name() === "self"
    }

    public signatureText(): string {
        const parametersNode = this.node.childForFieldName("parameters")
        if (!parametersNode) return ""

        let result = this.node.childForFieldName("result")
        if (result?.text === ":") {
            result = result?.nextSibling
        }
        return parametersNode.text + (result ? `: ${result.text}` : "")
    }

    public isOverride(): boolean {
        const attributes = this.node.childForFieldName("attributes")
        if (!attributes) return false
        return attributes.text.includes("override")
    }
}

export class Constant extends NamedNode {
    public value(): Expression | null {
        const value = this.node.childForFieldName("value")
        if (!value) return null
        return new Expression(value, this.file)
    }

    public typeNode(): Expression | null {
        const value = this.node.childForFieldName("type")
        if (!value) return null
        return new Expression(value, this.file)
    }
}
