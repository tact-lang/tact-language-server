import {Expression, NamedNode, Node} from "./Node";

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
}
