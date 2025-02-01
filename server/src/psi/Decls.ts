import {Expression, NamedNode} from "./Node"
import {Reference} from "./Reference"
import {index, IndexKey} from "@server/indexes"
import {parentOfType} from "./utils"
import {Node as SyntaxNode} from "web-tree-sitter"
import {findInstruction} from "@server/completion/data/types"

export class FieldsOwner extends NamedNode {
    public fields(): Field[] {
        const body = this.node.childForFieldName("body")
        if (!body) return []
        return body.children
            .filter(value => value !== null && value.type === "field")
            .map(value => new Field(value!, this.file))
    }
}

export class Message extends FieldsOwner {}

export class Struct extends FieldsOwner {}

export class Primitive extends NamedNode {}

export class StorageMembersOwner extends NamedNode {
    public ownMethods(): Fun[] {
        const body = this.node.childForFieldName("body")
        if (!body) return []
        return body.children
            .filter(value => value !== null && value.type === "storage_function")
            .map(value => new Fun(value!, this.file))
    }

    public ownFields(): Field[] {
        const body = this.node.childForFieldName("body")
        if (!body) return []
        return body.children
            .filter(value => value !== null && value.type === "storage_variable")
            .map(value => new Field(value!, this.file))
    }

    public ownConstants(): Constant[] {
        const body = this.node.childForFieldName("body")
        if (!body) return []
        return body.children
            .filter(value => value !== null && value.type === "storage_constant")
            .map(value => new Constant(value!, this.file))
    }

    public methods(): Fun[] {
        const own = this.ownMethods()
        const inherited = this.inheritTraits().flatMap(trait => trait.methods())
        return [...own, ...inherited]
    }

    public fields(): Field[] {
        const own = this.ownFields()
        const inherited = this.inheritTraits().flatMap(trait => trait.fields())
        return [...own, ...inherited]
    }

    public inheritTraits(): Trait[] {
        if (this.name() === "BaseTrait") {
            return []
        }

        const baseTraitNode = index.elementByName(IndexKey.Traits, "BaseTrait")

        const traitList = this.node.childForFieldName("traits")
        const baseTraitOrEmpty =
            baseTraitNode !== null ? [new Trait(baseTraitNode.node, baseTraitNode.file)] : []

        if (!traitList) {
            return [...baseTraitOrEmpty]
        }

        const inheritTraits = traitList.children
            .filter(value => value !== null && value?.type === "type_identifier")
            .map(value => new NamedNode(value!, this.file))
            .map(node => Reference.resolve(node))
            .filter(node => node !== null)
            .map(node => (node instanceof Trait ? node : new Trait(node.node, node.file)))

        return [...inheritTraits, ...baseTraitOrEmpty]
    }
}

export class Trait extends StorageMembersOwner {}

export class Contract extends StorageMembersOwner {}

export class Fun extends NamedNode {
    public hasBody(): boolean {
        return this.node.type !== "native_function" && this.node.type !== "asm_function"
    }

    public returnType(): Expression | null {
        const result = this.node.childForFieldName("result")
        if (!result) return null
        if (result.text === ":") {
            // some weird bug
            return new Expression(result.nextSibling!, this.file)
        }
        return new Expression(result, this.file)
    }

    public parameters(): NamedNode[] {
        const parametersNode = this.node.childForFieldName("parameters")
        if (!parametersNode) return []

        return parametersNode.children
            .filter(value => value !== null && value?.type === "parameter")
            .map(value => new NamedNode(value!, this.file))
    }

    public withSelf(): boolean {
        const params = this.parameters()
        if (params.length === 0) return false
        const first = params[0]
        return first.name() === "self"
    }

    public signatureText(): string {
        const parametersNode = this.node.childForFieldName("parameters")
        if (!parametersNode) return ""

        let result = this.node.childForFieldName("result")
        if (result?.text === ":") {
            result = result?.nextSibling
        }
        return parametersNode.text + (result ? `: ${result.text}` : "")
    }

    public isOverride(): boolean {
        const attributes = this.node.childForFieldName("attributes")
        if (!attributes) return false
        return attributes.text.includes("override")
    }

    public owner(): StorageMembersOwner | null {
        const ownerNode = parentOfType(this.node, "trait", "contract")
        if (!ownerNode) return null

        return new StorageMembersOwner(ownerNode, this.file)
    }

    public modifiers(): string {
        let parts: string[] = []
        const asm = this.node.children[0]
        if (asm && asm.text === "asm") {
            const asmArrangement = this.node.childForFieldName("arrangement")
            if (asmArrangement) {
                parts.push("asm" + asmArrangement.text)
            } else {
                parts.push("asm")
            }
        }
        const attributes = this.node.childForFieldName("attributes")
        if (attributes) {
            parts.push(attributes.text)
        }
        if (parts.length === 0) return ""
        return parts.join(" ") + " "
    }

    public openBrace(): SyntaxNode | null {
        const body = this.node.childForFieldName("body")
        if (!body) return null
        return body.firstChild
    }

    public computeGasConsumption(): GasConsumption {
        const body = this.node.childForFieldName("body")
        if (!body) {
            return {
                value: 0,
                unknown: true,
                exact: false,
                singleInstr: false,
            }
        }

        const singleInstr = body.children.length === 3
        let exact = true
        let res = 0

        for (const child of body.children) {
            if (!child) continue

            if (child.type !== "tvm_ordinary_word") continue
            const name = child.text
            const instr = findInstruction(name)
            if (!instr || instr.doc.gas === "") {
                exact = false
                continue
            }
            if (instr.doc.gas.includes("|") || instr.doc.gas.includes("+")) {
                exact = false
            }
            res += parseInt(instr.doc.gas)
        }

        if (!exact && singleInstr) {
            return {
                value: 0,
                unknown: true,
                exact: false,
                singleInstr: true,
            }
        }

        return {
            value: res,
            unknown: false,
            exact,
            singleInstr: singleInstr,
        }
    }
}

export type GasConsumption = {
    value: number
    unknown: boolean
    exact: boolean
    singleInstr: boolean
}

export class Field extends NamedNode {
    public typeNode(): Expression | null {
        const value = this.node.childForFieldName("type")
        if (!value) return null
        return new Expression(value, this.file)
    }

    public owner(): StorageMembersOwner | null {
        const ownerNode = parentOfType(this.node, "trait", "contract")
        if (!ownerNode) return null

        return new StorageMembersOwner(ownerNode, this.file)
    }
}

export class Constant extends NamedNode {
    public value(): Expression | null {
        const value = this.node.childForFieldName("value")
        if (!value) return null
        return new Expression(value, this.file)
    }

    public typeNode(): Expression | null {
        const value = this.node.childForFieldName("type")
        if (!value) return null
        return new Expression(value, this.file)
    }

    public owner(): StorageMembersOwner | null {
        const ownerNode = parentOfType(this.node, "trait", "contract")
        if (!ownerNode) return null

        return new StorageMembersOwner(ownerNode, this.file)
    }

    public modifiers(): string {
        const attributes = this.node.childForFieldName("attributes")
        if (!attributes) return ""
        return attributes.text + " "
    }
}
