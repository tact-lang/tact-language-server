import {Expression, NamedNode} from "./Node";

export class FieldsOwner extends NamedNode {
    public fields(): NamedNode[] {
        const body = this.node.childForFieldName('body');
        if (!body) return []
        return body.children
            .filter(value => value.type === 'field')
            .map(value => new NamedNode(value, this.file))
    }
}

export class Message extends FieldsOwner {
}

export class Struct extends FieldsOwner {
}

export class Primitive extends NamedNode {
}

export class Function extends NamedNode {
    public returnType(): Expression | null {
        const result = this.node.childForFieldName('result')
        if (!result) return null
        return new Expression(result.nextSibling!, this.file)
    }

    public parameters(): NamedNode[] {
        const parametersNode = this.node.childForFieldName('parameters')
        if (!parametersNode) return []

        return parametersNode.children
            .filter(value => value.type === 'parameter')
            .map(value => new NamedNode(value, this.file))
    }

    public withSelf(): boolean {
        const params = this.parameters()
        if (params.length === 0) return false
        const first = params[0]
        return first.name() === 'self'
    }

    public signatureText(): string {
        const parametersNode = this.node.childForFieldName('parameters')
        if (!parametersNode) return ""

        const result = this.node.childForFieldName('result')?.nextSibling
        return parametersNode.text + (result ? `: ${result.text}` : '')
    }
}

export class Constant extends NamedNode {
    public value(): Expression | null {
        const value = this.node.childForFieldName('value')
        if (!value) return null
        return new Expression(value, this.file)
    }

    public typeNode(): Expression | null {
        const value = this.node.childForFieldName('type')
        if (!value) return null
        return new Expression(value, this.file)
    }
}
