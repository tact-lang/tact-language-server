import {Struct, Message, FieldsOwner} from "../psi/TopLevelDeclarations";
import {NamedNode, Node} from "../psi/Node";

export interface Ty {
    name(): string

    qualifiedName(): string
}

export abstract class BaseTy<Anchor> implements Ty {
    anchor: Anchor | null = null;
    _name: string

    public constructor(_name: string, anchor: Anchor | null) {
        this.anchor = anchor
        this._name = _name
    }

    public name(): string {
        return this._name;
    }

    public qualifiedName(): string {
        return this._name;
    }
}

export class FieldsOwnerTy<Anchor extends FieldsOwner> extends BaseTy<Anchor> {
    public fields(): NamedNode[] {
        if (this.anchor === null) return []
        return this.anchor.fields()
    }
}

export class StructTy extends FieldsOwnerTy<Struct> {
}

export class MessageTy extends FieldsOwnerTy<Message> {
}

export class PrimitiveTy extends BaseTy<Node> {
}
