import {Constant, Contract, Field, Trait} from "@server/psi/Decls"
import {index, IndexKey} from "@server/indexes"
import {ResolveState, ScopeProcessor} from "@server/psi/Reference"
import {Node} from "@server/psi/Node"

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

    execute(node: Node, _state: ResolveState): boolean {
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

export function superField(field: Field): Field | null {
    const owner = field.owner()
    if (!owner) return null

    const inheritTraits = owner.inheritTraits()
    if (inheritTraits.length === 0) return null

    const superTraitWithField = inheritTraits.find(t =>
        t.fields().find(it => it.name() === field.name()),
    )
    if (!superTraitWithField) return null

    return superTraitWithField.fields().find(it => it.name() === field.name()) ?? null
}

export function superConstant(constant: Constant): Field | null {
    const owner = constant.owner()
    if (!owner) return null

    const inheritTraits = owner.inheritTraits()
    if (inheritTraits.length === 0) return null

    const superTraitWithConstant = inheritTraits.find(t =>
        t.constants().find(it => it.name() === constant.name()),
    )
    if (!superTraitWithConstant) return null

    return superTraitWithConstant.constants().find(it => it.name() === constant.name()) ?? null
}
