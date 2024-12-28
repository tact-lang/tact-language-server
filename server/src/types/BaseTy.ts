import {Node} from "../reference";

export interface Ty {
    name(): string
    qualifiedName(): string
}

export abstract class BaseTy implements Ty {
    anchor: Node | null = null;

    protected constructor(anchor: Node | null) {
        this.anchor = anchor
    }

    abstract name(): string
    abstract qualifiedName(): string
}

export class StructTy extends BaseTy {
    constructor(public _name: string, anchor: Node | null) {
        super(anchor);
    }

    name(): string {
        return this._name;
    }

    qualifiedName(): string {
        return this._name;
    }
}

export class PrimitiveTy extends BaseTy {
    constructor(public _name: string, anchor: Node | null) {
        super(anchor);
    }

    name(): string {
        return this._name;
    }

    qualifiedName(): string {
        return this._name;
    }
}
