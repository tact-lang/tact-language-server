//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import {Constant, Contract, Field, Fun, Trait} from "@server/psi/Decls"
import {index, IndexKey} from "@server/indexes"
import {ResolveState, ScopeProcessor} from "@server/psi/Reference"
import type {Node} from "@server/psi/Node"

export function implementations(trait: Trait): (Contract | Trait)[] {
    const result: (Contract | Trait)[] = []

    const s = new ResolveState()
    index.processElementsByKey(IndexKey.Contracts, new ImplementationProcessor(trait, result), s)
    index.processElementsByKey(IndexKey.Traits, new ImplementationProcessor(trait, result), s)

    return result
}

class ImplementationProcessor implements ScopeProcessor {
    public constructor(
        public trait: Trait,
        public result: (Contract | Trait)[],
    ) {}

    public execute(node: Node, _state: ResolveState): boolean {
        if (!(node instanceof Trait) && !(node instanceof Contract)) return true

        const inheritsFromTrait = node
            .inheritTraits()
            .some(inheritTrait => inheritTrait.name() === this.trait.name())

        if (inheritsFromTrait) {
            this.result.push(node)
        }

        return true
    }
}

export function implementationsFun(fun: Fun): Fun[] {
    const owner = fun.owner()
    if (!owner) return []
    if (owner.node.type !== "trait") return []

    const traitImplementations = implementations(owner)
    return traitImplementations.flatMap(trait =>
        trait.ownMethods().filter(m => m.name() === fun.name()),
    )
}

export function superMethod(method: Fun): Fun | null {
    const owner = method.owner()
    if (!owner) return null

    const inheritTraits = owner.inheritTraits()
    if (inheritTraits.length === 0) return null

    const superTraitWithFun = inheritTraits.find(t =>
        t.methods().some(it => it.name() === method.name()),
    )
    if (!superTraitWithFun) return null

    return superTraitWithFun.methods().find(it => it.name() === method.name()) ?? null
}

export function superField(field: Field): Field | null {
    const owner = field.owner()
    if (!owner) return null

    const inheritTraits = owner.inheritTraits()
    if (inheritTraits.length === 0) return null

    const superTraitWithField = inheritTraits.find(t =>
        t.fields().some(it => it.name() === field.name()),
    )
    if (!superTraitWithField) return null

    return superTraitWithField.fields().find(it => it.name() === field.name()) ?? null
}

export function superConstant(constant: Constant): Constant | null {
    const owner = constant.owner()
    if (!owner) return null

    const inheritTraits = owner.inheritTraits()
    if (inheritTraits.length === 0) return null

    const superTraitWithConstant = inheritTraits.find(t =>
        t.constants().some(it => it.name() === constant.name()),
    )
    if (!superTraitWithConstant) return null

    return superTraitWithConstant.constants().find(it => it.name() === constant.name()) ?? null
}
