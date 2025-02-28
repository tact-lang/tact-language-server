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
import {NamedNode} from "@server/psi/Node"
import {trimPrefix} from "@server/utils/strings"
import {TypeInferer} from "@server/TypeInferer"

export interface Ty {
    name(): string

    qualifiedName(): string

    sizeOf(visited: Map<string, SizeOf>): SizeOf
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

    public abstract sizeOf(_visited: Map<string, SizeOf>): SizeOf
}

export interface SizeOf {
    readonly fixed: number
    readonly floating: number
}

const CELL_SIZE: SizeOf = {fixed: 0, floating: 1023}

export function sizeOfPresentation(size: SizeOf): string {
    if (size.floating === 0) {
        return `${size.fixed} bits`
    }
    return `${size.fixed} bits plus up to ${size.floating} bits`
}

function sizeOf(ty: Ty, visited: Map<string, SizeOf>): SizeOf {
    const typeName = ty.qualifiedName()
    const cached = visited.get(typeName)
    if (cached) {
        return cached
    }

    const actual = ty.sizeOf(visited)
    visited.set(typeName, actual)
    return actual
}

function mergeSizes(a: SizeOf, b: SizeOf): SizeOf {
    if (a.floating === 0 && b.floating === 0) {
        return {fixed: a.fixed + b.fixed, floating: 0}
    }

    return {fixed: a.fixed + b.fixed, floating: a.floating + b.floating}
}

export class FieldsOwnerTy<Anchor extends FieldsOwner> extends BaseTy<Anchor> {
    public fields(): Field[] {
        if (this.anchor === null) return []
        return this.anchor.fields()
    }

    public override sizeOf(visited: Map<string, SizeOf> = new Map()): SizeOf {
        let res: SizeOf = {fixed: 0, floating: 0}

        const fields = this.fields()
        fields.forEach(field => {
            const nameNode = field.nameNode()
            if (!nameNode) return
            const fieldTy = TypeInferer.inferType(nameNode)
            if (!fieldTy) return

            const size = sizeOf(fieldTy, visited)
            res = mergeSizes(res, size)
        })

        const headerSize = this.anchor?.node.type === "message" ? 32 : 0

        return mergeSizes(res, {
            fixed: headerSize,
            floating: 0,
        })
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
        return this._name
    }

    public override qualifiedName(): string {
        if (this.tlb !== null) {
            return `${this._name} as ${this.tlb}`
        }

        return this._name
    }

    public override sizeOf(_visited: Map<string, SizeOf>): SizeOf {
        switch (this.name()) {
            case "Int": {
                if (this.tlb) {
                    if (
                        this.tlb === "coins" ||
                        this.tlb === "varuint16" ||
                        this.tlb === "varint16"
                    ) {
                        return {fixed: 4, floating: 120}
                    }
                    if (this.tlb === "varuint32" || this.tlb === "varint32") {
                        return {fixed: 5, floating: 248}
                    }

                    const trimmed = trimPrefix(trimPrefix(this.tlb, "uint"), "int")
                    const size = Number.parseInt(trimmed, 10)
                    if (!Number.isNaN(size)) {
                        return {fixed: size, floating: 0}
                    }
                }

                return {fixed: 257, floating: 0}
            }
            case "Bool": {
                return {fixed: 1, floating: 0}
            }
            case "Address": {
                return {fixed: 267, floating: 0}
            }
            case "Cell":
            case "Slice":
            case "Builder":
            case "String": {
                return CELL_SIZE
            }
        }

        return {fixed: 0, floating: 0}
    }
}

export class PlaceholderTy extends BaseTy<NamedNode> {
    public sizeOf(_visited: Map<string, SizeOf>): SizeOf {
        return {fixed: 0, floating: 0}
    }
}

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

    public sizeOf(_visited: Map<string, SizeOf>): SizeOf {
        return {fixed: 0, floating: 0}
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

    public sizeOf(_visited: Map<string, SizeOf>): SizeOf {
        return this.innerTy.sizeOf(_visited)
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

    public sizeOf(_visited: Map<string, SizeOf>): SizeOf {
        const innerSizeOf = this.innerTy.sizeOf(_visited)
        return mergeSizes(innerSizeOf, {fixed: 1, floating: 0}) // 1 bit for null/not-null
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

    public sizeOf(_visited: Map<string, SizeOf>): SizeOf {
        return CELL_SIZE
    }
}

export class NullTy implements Ty {
    public name(): string {
        return "null"
    }

    public qualifiedName(): string {
        return "null"
    }

    public sizeOf(_visited: Map<string, SizeOf>): SizeOf {
        return {fixed: 0, floating: 0}
    }
}
