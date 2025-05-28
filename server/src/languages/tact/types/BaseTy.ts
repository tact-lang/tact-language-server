//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
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
} from "@server/languages/tact/psi/Decls"
import {NamedNode} from "@server/languages/tact/psi/TactNode"
import {trimPrefix} from "@server/utils/strings"
import {TypeInferer} from "@server/languages/tact/TypeInferer"

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
    readonly valid: boolean
    readonly fixed: number
    readonly floating: number
}

const CELL_SIZE: SizeOf = {fixed: 0, floating: 1023, valid: true}

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
        return {fixed: a.fixed + b.fixed, floating: 0, valid: a.valid && b.valid}
    }

    return {fixed: a.fixed + b.fixed, floating: a.floating + b.floating, valid: a.valid && b.valid}
}

export class FieldsOwnerTy<Anchor extends FieldsOwner> extends BaseTy<Anchor> {
    public fields(): Field[] {
        if (this.anchor === null) return []
        return this.anchor.fields()
    }

    public override sizeOf(visited: Map<string, SizeOf> = new Map()): SizeOf {
        let res: SizeOf = {fixed: 0, floating: 0, valid: true}

        const fields = this.fields()
        for (const field of fields) {
            const nameNode = field.nameNode()
            if (!nameNode) return {...res, valid: false}
            const fieldTy = TypeInferer.inferType(nameNode)
            if (!fieldTy) return {...res, valid: false}

            const size = sizeOf(fieldTy, visited)
            res = mergeSizes(res, size)
        }

        const headerSize = this.anchor?.node.type === "message" ? 32 : 0

        return mergeSizes(res, {
            fixed: headerSize,
            floating: 0,
            valid: true,
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
                        return {fixed: 4, floating: 120, valid: true}
                    }
                    if (this.tlb === "varuint32" || this.tlb === "varint32") {
                        return {fixed: 5, floating: 248, valid: true}
                    }

                    const trimmed = trimPrefix(trimPrefix(this.tlb, "uint"), "int")
                    const size = Number.parseInt(trimmed, 10)
                    if (!Number.isNaN(size)) {
                        return {fixed: size, floating: 0, valid: true}
                    }
                }

                return {fixed: 257, floating: 0, valid: true}
            }
            case "Bool": {
                return {fixed: 1, floating: 0, valid: true}
            }
            case "Address": {
                return {fixed: 267, floating: 0, valid: true}
            }
            case "Cell":
            case "Slice":
            case "Builder":
            case "String": {
                return CELL_SIZE
            }
        }

        return {fixed: 0, floating: 0, valid: true}
    }
}

export class PlaceholderTy extends BaseTy<NamedNode> {
    public sizeOf(_visited: Map<string, SizeOf>): SizeOf {
        return {fixed: 0, floating: 0, valid: true}
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

    public fields(): Field[] {
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
        return {fixed: 0, floating: 0, valid: true}
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
        return mergeSizes(innerSizeOf, {fixed: 1, floating: 0, valid: true}) // 1 bit for null/not-null
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
        return {fixed: 0, floating: 0, valid: false} // we don't know the size of the map
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
        return {fixed: 0, floating: 0, valid: true}
    }
}

export function unwrapBounced(ty: Ty): Ty {
    if (ty instanceof BouncedTy) return ty.innerTy
    return ty
}
