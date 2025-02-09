import type {
    Struct,
    Message,
    FieldsOwner,
    Contract,
    Constant,
    Fun,
    Trait,
    StorageMembersOwner,
    Primitive,
    InitFunction,
    Field,
} from "@server/psi/Decls"
import type {NamedNode} from "@server/psi/Node"

export interface Ty {
    name(): string

    qualifiedName(): string
}

export abstract class BaseTy<Anchor extends NamedNode> implements Ty {
    public readonly anchor: Anchor | null = null
    protected readonly _name: string

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
    public fields(): Field[] {
        if (this.anchor === null) return []
        return this.anchor.fields()
    }
}

export class StructTy extends FieldsOwnerTy<Struct> {}

export class MessageTy extends FieldsOwnerTy<Message> {}

export class PrimitiveTy extends BaseTy<Primitive> {
    public constructor(
        name: string,
        anchor: Primitive | null,
        public tlb: string | null,
    ) {
        super(name, anchor)
    }

    public override name(): string {
        if (this.tlb !== null) {
            return `${this._name} as ${this.tlb}`
        }

        return this._name
    }

    public override qualifiedName(): string {
        if (this.tlb !== null) {
            return `${this._name} as ${this.tlb}`
        }

        return this._name
    }
}

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

    public initFunction(): InitFunction | null {
        if (this.anchor === null) return null
        return this.anchor.initFunction()
    }
}

export class TraitTy extends StorageMembersOwnerTy<Trait> {}

export class ContractTy extends StorageMembersOwnerTy<Contract> {}

export class BouncedTy implements Ty {
    public constructor(public innerTy: Ty) {}

    public name(): string {
        return `bounced<${this.innerTy.name()}>`
    }

    public qualifiedName(): string {
        return `bounced<${this.innerTy.qualifiedName()}>`
    }
}

export class OptionTy implements Ty {
    public constructor(public innerTy: Ty) {}

    public name(): string {
        return `${this.innerTy.name()}?`
    }

    public qualifiedName(): string {
        return `${this.innerTy.qualifiedName()}?`
    }
}

export class MapTy implements Ty {
    public constructor(
        public keyTy: Ty,
        public valueTy: Ty,
    ) {}

    public name(): string {
        return `map<${this.keyTy.name()}, ${this.valueTy.name()}>`
    }

    public qualifiedName(): string {
        return `map<${this.keyTy.qualifiedName()}, ${this.valueTy.qualifiedName()}>`
    }
}

export class NullTy implements Ty {
    public name(): string {
        return "null"
    }

    public qualifiedName(): string {
        return "null"
    }
}
