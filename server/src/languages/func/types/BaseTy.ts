//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio

import type {
    FuncFunction,
} from "@server/languages/func/psi/FuncDecls"

export interface FuncTy {
    name(): string
    qualifiedName(): string
    isAssignableTo(other: FuncTy): boolean
}

export class FuncPrimitiveTy implements FuncTy {
    private readonly _name: string
    public readonly tlb: string | null

    public constructor(name: string, tlb: string | null = null) {
        this._name = name
        this.tlb = tlb
    }

    public name(): string {
        return this._name
    }

    public qualifiedName(): string {
        return this._name
    }

    public isAssignableTo(other: FuncTy): boolean {
        if (other instanceof FuncPrimitiveTy) {
            // Auto types are compatible with everything
            if (this._name === "var" || other._name === "var") {
                return true
            }
            return this._name === other._name
        }
        return false
    }
}

export class FuncTupleTy implements FuncTy {
    public readonly elementTypes: FuncTy[]

    public constructor(elementTypes: FuncTy[]) {
        this.elementTypes = elementTypes
    }

    public name(): string {
        return `(${this.elementTypes.map(t => t.name()).join(", ")})`
    }

    public qualifiedName(): string {
        return this.name()
    }

    public isAssignableTo(other: FuncTy): boolean {
        if (other instanceof FuncTupleTy) {
            if (this.elementTypes.length !== other.elementTypes.length) {
                return false
            }
            return this.elementTypes.every((t, i) => t.isAssignableTo(other.elementTypes[i]))
        }
        return false
    }
}

export class FuncFunctionTy implements FuncTy {
    public readonly paramTypes: FuncTy[]
    public readonly returnType: FuncTy
    public readonly definition: FuncFunction

    public constructor(paramTypes: FuncTy[], returnType: FuncTy, definition: FuncFunction) {
        this.paramTypes = paramTypes
        this.returnType = returnType
        this.definition = definition
    }

    public name(): string {
        const params = this.paramTypes.map(t => t.name()).join(", ")
        return `(${params}) -> ${this.returnType.name()}`
    }

    public qualifiedName(): string {
        return this.name()
    }

    public isAssignableTo(other: FuncTy): boolean {
        if (other instanceof FuncFunctionTy) {
            if (this.paramTypes.length !== other.paramTypes.length) {
                return false
            }
            const paramsMatch = this.paramTypes.every((t, i) =>
                t.isAssignableTo(other.paramTypes[i]),
            )
            const returnMatch = this.returnType.isAssignableTo(other.returnType)
            return paramsMatch && returnMatch
        }
        return false
    }
}

export class FuncUnknownTy implements FuncTy {
    public name(): string {
        return "unknown"
    }

    public qualifiedName(): string {
        return "unknown"
    }

    public isAssignableTo(other: FuncTy): boolean {
        return false
    }
}

// Built-in FunC types
export const FUNC_BUILTIN_TYPES: Record<string, FuncPrimitiveTy> = {
    int: new FuncPrimitiveTy("int"),
    cell: new FuncPrimitiveTy("cell"),
    slice: new FuncPrimitiveTy("slice"),
    builder: new FuncPrimitiveTy("builder"),
    cont: new FuncPrimitiveTy("cont"),
    tuple: new FuncPrimitiveTy("tuple"),
    var: new FuncPrimitiveTy("var"),
}

// Common method return types for different types
export const FUNC_METHOD_RETURN_TYPES: Record<string, Record<string, string>> = {
    slice: {
        load_uint: "int",
        load_int: "int",
        load_coins: "int",
        load_ref: "cell",
        preload_uint: "int",
        preload_int: "int",
        preload_ref: "cell",
        skip_bits: "slice",
        first_bits: "slice",
        slice_bits: "int",
        slice_refs: "int",
        "slice_empty?": "int",
    },
    builder: {
        store_uint: "builder",
        store_int: "builder",
        store_coins: "builder",
        store_ref: "builder",
        store_slice: "builder",
        end_cell: "cell",
        builder_bits: "int",
        builder_refs: "int",
    },
    cell: {
        begin_parse: "slice",
        cell_hash: "int",
        cell_depth: "int",
    },
    int: {
        abs: "int",
        min: "int",
        max: "int",
    },
    tuple: {
        first: "var",
        second: "var",
        third: "var",
        at: "var",
        tlen: "int",
    },
}
