import {
    Struct,
    Message,
    FieldsOwner,
    Contract,
    Constant,
    Fun,
    Trait,
    StorageMembersOwner,
    Primitive,
} from "@server/psi/Decls"
import {NamedNode} from "@server/psi/Node"

export interface Ty {
    name(): string

    qualifiedName(): string
}

export abstract class BaseTy<Anchor extends NamedNode> implements Ty {
    anchor: Anchor | null = null
    _name: string

    public constructor(_name: string, anchor: Anchor | null) {
        this.anchor = anchor
        this._name = _name
    }

    public name(): string {
        return this._name
    }

    public qualifiedName(): string {
        return this._name
    }
}

export class FieldsOwnerTy<Anchor extends FieldsOwner> extends BaseTy<Anchor> {
    public fields(): NamedNode[] {
        if (this.anchor === null) return []
        return this.anchor.fields()
    }
}

export class StructTy extends FieldsOwnerTy<Struct> {}

export class MessageTy extends FieldsOwnerTy<Message> {}

export class PrimitiveTy extends BaseTy<Primitive> {}

export class PlaceholderTy extends BaseTy<NamedNode> {}

export class StorageMembersOwnerTy<Anchor extends StorageMembersOwner> extends BaseTy<Anchor> {
    public ownMethods(): Fun[] {
        if (this.anchor === null) return []
        return this.anchor.ownMethods()
    }

    public ownFields(): NamedNode[] {
        if (this.anchor === null) return []
        return this.anchor.ownFields()
    }

    public ownConstants(): Constant[] {
        if (this.anchor === null) return []
        return this.anchor.ownConstants()
    }

    public constants(): Constant[] {
        if (this.anchor === null) return []
        return this.anchor.constants()
    }

    public fields(): NamedNode[] {
        if (this.anchor === null) return []
        return this.anchor.fields()
    }

    public methods(): Fun[] {
        if (this.anchor === null) return []
        return this.anchor.methods()
    }
}

export class TraitTy extends StorageMembersOwnerTy<Trait> {}

export class ContractTy extends StorageMembersOwnerTy<Contract> {}

export class BouncedTy implements Ty {
    constructor(public innerTy: Ty) {}

    name(): string {
        return `bounced<${this.innerTy.name()}>`
    }

    qualifiedName(): string {
        return `bounced<${this.innerTy.qualifiedName()}>`
    }
}

export class OptionTy implements Ty {
    constructor(public innerTy: Ty) {}

    name(): string {
        return `${this.innerTy.name()}?`
    }

    qualifiedName(): string {
        return `${this.innerTy.qualifiedName()}?`
    }
}

export class MapTy implements Ty {
    constructor(
        public keyTy: Ty,
        public valueTy: Ty,
    ) {}

    name(): string {
        return `map<${this.keyTy.name()}, ${this.valueTy.name()}>`
    }

    qualifiedName(): string {
        return `map<${this.keyTy.qualifiedName()}, ${this.valueTy.qualifiedName()}>`
    }
}

export class NullTy implements Ty {
    name(): string {
        return "null"
    }

    qualifiedName(): string {
        return "null"
    }
}
