import {Struct, Message, FieldsOwner, Contract, Constant, Function} from "../psi/TopLevelDeclarations";
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

export class ContractTy extends BaseTy<Contract> {
    public methods(): Function[] {
        if (this.anchor === null) return []
        return this.anchor.methods()
    }

    public fields(): NamedNode[] {
        if (this.anchor === null) return []
        return this.anchor.fields()
    }

    public constants(): Constant[] {
        if (this.anchor === null) return []
        return this.anchor.constants()
    }
}

export class BouncedTy implements Ty {
    constructor(public innerTy: Ty) {
    }

    name(): string {
        return `bounced<${this.innerTy.name()}>`;
    }

    qualifiedName(): string {
        return `bounced<${this.innerTy.qualifiedName()}>`;
    }
}

