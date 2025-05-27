//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import {AsmInstr, Expression, NamedNode, Node} from "./Node"
import {Reference} from "./Reference"
import {index, IndexKey} from "@server/indexes"
import {parentOfType} from "./utils"
import type {Node as SyntaxNode} from "web-tree-sitter"
import {crc16} from "@server/utils/crc16"
import {Position} from "vscode-languageclient"
import {asLspPosition} from "@server/utils/position"
import {computeGasConsumption, GasConsumption} from "@server/asm/gas"
import {messageOpcode} from "@server/compiler/tlb/compiler-tlb"
import {MessageTy} from "@server/types/BaseTy"
import {normalizeIndentation} from "@server/utils/strings"

export class FieldsOwner extends NamedNode {
    public kind(): string {
        if (this.node.type === "message") {
            return "message"
        }
        return "struct"
    }

    public fields(): Field[] {
        const body = this.node.childForFieldName("body")
        if (!body) return []
        return body.children
            .filter(value => value?.type === "field")
            .filter(value => value !== null)
            .map(value => new Field(value, this.file))
    }
}

export class Message extends FieldsOwner {
    public body(): SyntaxNode | null {
        return this.node.childForFieldName("body")
    }

    public explicitOpcode(): undefined | string {
        const value = this.node.childForFieldName("value")
        if (!value) return undefined
        return value.text.slice(1, -1)
    }

    public explicitOpcodeNode(): undefined | SyntaxNode {
        const value = this.node.childForFieldName("value")
        if (!value) return undefined
        return value.child(1) ?? undefined
    }

    public opcode(): undefined | string {
        const explicitOpcode = this.explicitOpcode()
        if (explicitOpcode !== undefined) {
            if (explicitOpcode.startsWith("0x")) {
                return explicitOpcode
            }

            const num = Number.parseInt(explicitOpcode)
            if (!Number.isNaN(num)) {
                return "0x" + num.toString(16)
            }

            // let's try to resolve constant value
            const opcodeNode = this.explicitOpcodeNode()
            if (!opcodeNode || opcodeNode.type !== "identifier") return undefined

            const resolved = Reference.resolve(new NamedNode(opcodeNode, this.file))
            if (resolved instanceof Constant) {
                const value = resolved.value()
                if (!value || value.node.type !== "integer") return undefined
                const valueText = value.node.text

                const num = Number.parseInt(valueText)
                if (Number.isNaN(num)) {
                    return undefined
                }
                return "0x" + num.toString(16)
            }

            return undefined
        }

        const opcode = messageOpcode(new MessageTy(this.name(), this))
        if (opcode === undefined) return undefined
        return "0x" + opcode.toString(16)
    }
}

export class Struct extends FieldsOwner {
    public body(): SyntaxNode | null {
        return this.node.childForFieldName("body")
    }

    public lastFieldPos(): Position | null {
        const body = this.node.childForFieldName("body")
        if (!body) return null

        const fields = this.fields()

        if (fields.length === 0) {
            const openBrace = body.firstChild
            if (!openBrace) return null
            return asLspPosition(openBrace.endPosition)
        }

        const field = fields.at(-1)
        if (!field) return null

        return asLspPosition(field.node.endPosition)
    }
}

export class Primitive extends NamedNode {}

export class StorageMembersOwner extends NamedNode {
    public kind(): string {
        if (this.node.type === "trait") {
            return "trait"
        }
        return "contract"
    }

    public initFunction(): InitFunction | null {
        const body = this.node.childForFieldName("body")
        if (!body) return null
        const candidates = body.children
            .filter(value => value?.type === "init_function")
            .filter(value => value !== null)
            .map(value => new InitFunction(value, this.file))
        if (candidates.length === 0) return null
        return candidates[0]
    }

    public messageFunctions(): MessageFunction[] {
        const body = this.node.childForFieldName("body")
        if (!body) return []
        return body.children
            .filter(
                value =>
                    value?.type === "receive_function" ||
                    value?.type === "external_function" ||
                    value?.type === "bounced_function",
            )
            .filter(value => value !== null)
            .map(value => new MessageFunction(value, this.file))
    }

    public ownMethods(): Fun[] {
        const body = this.node.childForFieldName("body")
        if (!body) return []
        return body.children
            .filter(value => value?.type === "storage_function")
            .filter(value => value !== null)
            .map(value => new Fun(value, this.file))
    }

    public parametersNode(): undefined | SyntaxNode {
        const params = this.node.childForFieldName("parameters")
        if (!params) return undefined
        return params
    }

    public parameters(): Field[] {
        const params = this.node.childForFieldName("parameters")
        if (!params) return []
        return params.children
            .filter(value => value?.type === "parameter")
            .filter(value => value !== null)
            .map(value => new Field(value, this.file))
    }

    public ownFields(): Field[] {
        const parameters = this.parameters()
        const body = this.node.childForFieldName("body")
        if (!body) return parameters
        const fields = body.children
            .filter(value => value?.type === "storage_variable")
            .filter(value => value !== null)
            .map(value => new Field(value, this.file))
        return [...parameters, ...fields]
    }

    public ownConstants(): Constant[] {
        const body = this.node.childForFieldName("body")
        if (!body) return []
        return body.children
            .filter(value => value?.type === "storage_constant")
            .filter(value => value !== null)
            .map(value => new Constant(value, this.file))
    }

    public methods(): Fun[] {
        const own = this.ownMethods()
        const inherited = this.inheritTraits().flatMap(trait => trait.methods())
        return [...own, ...inherited]
    }

    public fields(): Field[] {
        const fields: Map<string, Field> = new Map()
        for (const value of this.ownFields()) {
            fields.set(value.name(), value)
        }
        for (const trait of this.inheritTraits()) {
            for (const value of trait.fields()) {
                fields.set(value.name(), value)
            }
        }
        return [...fields.values()]
    }

    public constants(): Constant[] {
        const own = this.ownConstants()
        const inherited = this.inheritTraits().flatMap(trait => trait.constants())
        return [...own, ...inherited]
    }

    public inheritTraits(): Trait[] {
        if (this.name() === "BaseTrait") {
            return []
        }

        const baseTraitNode = index.stdlibRoot?.elementByName(IndexKey.Traits, "BaseTrait") ?? null

        const traitList = this.node.childForFieldName("traits")
        const baseTraitOrEmpty =
            baseTraitNode === null ? [] : [new Trait(baseTraitNode.node, baseTraitNode.file)]

        if (!traitList) {
            return [...baseTraitOrEmpty]
        }

        const inheritTraits = traitList.children
            .filter(value => value?.type === "type_identifier")
            .filter(value => value !== null)
            .map(value => new NamedNode(value, this.file))
            .map(node => Reference.resolve(node))
            .filter(node => node !== null)
            .map(node => (node instanceof Trait ? node : new Trait(node.node, node.file)))

        return [...inheritTraits, ...baseTraitOrEmpty]
    }

    public inheritTraitsList(): NamedNode[] {
        if (this.name() === "BaseTrait") {
            return []
        }

        const traitList = this.node.childForFieldName("traits")
        if (!traitList) {
            return []
        }

        const inheritTraits = traitList.children
            .filter(value => value?.type === "type_identifier")
            .filter(value => value !== null)
            .map(value => new NamedNode(value, this.file))

        return [...inheritTraits]
    }

    public positionForReceiver(): Position | null {
        const initFunction = this.initFunction()
        if (initFunction) {
            return asLspPosition(initFunction.node.endPosition)
        }

        const fields = this.fields()
        if (fields.length === 0) {
            const openBrace = this.node.childForFieldName("body")?.firstChild
            if (!openBrace) return null
            return asLspPosition(openBrace.endPosition)
        }

        const lastField = fields.at(-1)
        if (!lastField) return null

        return asLspPosition(lastField.node.endPosition)
    }

    public openBrace(): SyntaxNode | undefined {
        const body = this.node.childForFieldName("body")
        return body?.firstChild ?? undefined
    }

    public singleLine(): boolean {
        const body = this.node.childForFieldName("body")
        const openBrace = body?.firstChild
        const closeBrace = body?.lastChild
        if (!openBrace || !closeBrace) return false

        return openBrace.startPosition.row === closeBrace.endPosition.row
    }
}

export class Trait extends StorageMembersOwner {}

export class Contract extends StorageMembersOwner {
    public hasLazyInitializationBit(): boolean {
        return this.parametersNode() === undefined
    }
}

export class InitFunction extends Node {
    public nameLike(): string {
        const parametersNode = this.node.childForFieldName("parameters")
        if (!parametersNode) return "init()"
        return `init${parametersNode.text}`
    }

    public parametersPresentation(): string {
        const parametersNode = this.node.childForFieldName("parameters")
        if (!parametersNode) return "()"
        return parametersNode.text
    }

    public endParen(): SyntaxNode | null {
        const parametersNode = this.node.childForFieldName("parameters")
        if (!parametersNode) return null
        return parametersNode.lastChild
    }

    public lastStatementPos(): Position | null {
        const body = this.node.childForFieldName("body")
        if (!body) return null

        const children = body.children.filter(value => value !== null)
        if (children.length === 0) return null
        if (children.length <= 2) return asLspPosition(children[0].endPosition)

        const statements = children.slice(1, -1)
        const lastStatement = statements.at(-1)
        if (!lastStatement) return null

        return asLspPosition(lastStatement.endPosition)
    }

    public get hasOneLineBody(): boolean {
        const body = this.node.childForFieldName("body")
        if (!body) return false

        const firstChild = body.firstChild
        const lastChild = body.lastChild
        if (!firstChild || !lastChild) return false

        return firstChild.startPosition.row === lastChild.startPosition.row
    }

    public parameters(): NamedNode[] {
        const parametersNode = this.node.childForFieldName("parameters")
        if (!parametersNode) return []

        return parametersNode.children
            .filter(value => value?.type === "parameter")
            .filter(value => value !== null)
            .map(value => new NamedNode(value, this.file))
    }

    public initIdentifier(): SyntaxNode | null {
        return this.node.firstChild
    }
}

export class MessageFunction extends Node {
    public nameLike(): string {
        const parametersNode = this.node.childForFieldName("parameter")
        const kindIdent = this.kindIdentifier()
        if (!kindIdent) return "unknown()"
        if (!parametersNode) return `${kindIdent.text}()`
        return `${kindIdent.text}(${parametersNode.text})`
    }

    public isStringFallback(): boolean {
        const parameter = this.parameter()
        if (!parameter) return false
        const parameterType = new Expression(parameter, this.file).type()
        if (!parameterType) return false
        return parameterType.name() === "String"
    }

    public parameter(): SyntaxNode | null {
        return this.node.childForFieldName("parameter")
    }

    public parameterName(): string | null {
        const param = this.node.childForFieldName("parameter")
        return param?.childForFieldName("name")?.text ?? null
    }

    public kindIdentifier(): SyntaxNode | null {
        return this.node.firstChild
    }
}

export class Fun extends NamedNode {
    public hasBody(): boolean {
        if (this.isAbstract()) return false
        if (this.node.type === "asm_function" || this.node.type === "native_function") return false
        return this.node.childForFieldName("body") !== null
    }

    public get body(): SyntaxNode | null {
        return this.node.childForFieldName("body")
    }

    public hasSmallBody(maxLines: number): boolean {
        const body = this.node.childForFieldName("body")
        if (!body) return false

        const firstChild = body.firstChild
        const lastChild = body.lastChild
        if (!firstChild || !lastChild) return false

        return firstChild.startPosition.row - lastChild.startPosition.row <= maxLines
    }

    public bodyPresentation(maxLines: number): string {
        if (!this.hasSmallBody(maxLines)) return ""

        const body = this.node.childForFieldName("body")
        if (!body) return ""
        return " " + normalizeIndentation(body.text)
    }

    public get isGetMethod(): boolean {
        return this.modifiers().includes("get")
    }

    public get hasExplicitMethodId(): boolean {
        // check for
        // get(0x1000) fun foo() {}
        //    ^^^^^^^^ this
        const attributes = this.node.childForFieldName("attributes")
        if (!attributes) return false
        const getAttrs = attributes.children.find(attr => attr?.type === "get_attribute")
        if (!getAttrs) return false
        return getAttrs.children.some(it => it?.text === "(")
    }

    public get getExplicitMethodId(): SyntaxNode | null {
        // find
        // get(0x1000) fun foo() {}
        //     ^^^^^^ this
        const attributes = this.node.childForFieldName("attributes")
        if (!attributes) return null
        const getAttrs = attributes.children.find(attr => attr?.type === "get_attribute")
        if (!getAttrs) return null
        return getAttrs.childForFieldName("value")
    }

    public returnType(): Expression | null {
        const result = this.node.childForFieldName("result")
        if (!result) return null
        if (result.text === ":") {
            // some weird bug
            const actualTypeNode = result.nextSibling
            if (!actualTypeNode) return null

            return new Expression(actualTypeNode, this.file)
        }
        return new Expression(result, this.file)
    }

    public parameters(): NamedNode[] {
        const parametersNode = this.node.childForFieldName("parameters")
        if (!parametersNode) return []

        return parametersNode.children
            .filter(value => value?.type === "parameter")
            .filter(value => value !== null)
            .map(value => new NamedNode(value, this.file))
    }

    public withSelf(): boolean {
        const params = this.parameters()
        if (params.length === 0) return false
        const first = params[0]
        return first.name() === "self"
    }

    public selfParam(): NamedNode | null {
        const params = this.parameters()
        if (params.length === 0) return null
        const first = params[0]
        if (first.name() !== "self") return null
        return first
    }

    public signaturePresentation(): string {
        const parametersNode = this.node.childForFieldName("parameters")
        if (!parametersNode) return ""

        const result = this.returnType()
        const suffix = result?.node.nextSibling?.text === "?" ? "?" : ""

        return parametersNode.text + (result ? `: ${result.node.text}${suffix}` : "")
    }

    public isOverride(): boolean {
        return this.modifiers().includes("override")
    }

    public isAbstract(): boolean {
        return this.modifiers().includes("abstract")
    }

    public isVirtual(): boolean {
        return this.modifiers().includes("virtual")
    }

    public isInline(): boolean {
        return this.modifiers().includes("inline")
    }

    public isNative(): boolean {
        return this.node.type === "native_function"
    }

    public isAsm(): boolean {
        return this.node.type === "asm_function"
    }

    public owner(): StorageMembersOwner | null {
        const ownerNode = parentOfType(this.node, "trait", "contract")
        if (!ownerNode) return null

        return new StorageMembersOwner(ownerNode, this.file)
    }

    public modifiers(): string {
        const parts: string[] = []
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

    public closeBrace(): SyntaxNode | null {
        const body = this.node.childForFieldName("body")
        if (!body) return null
        return body.lastChild
    }

    public nameAttribute(): SyntaxNode | null {
        const attr = this.node.childForFieldName("name_attribute")
        if (!attr) return null
        return attr
    }

    public computeMethodId(): string {
        const explicitId = this.getExplicitMethodId
        if (explicitId) {
            return explicitId.text
        }

        return "0x" + ((crc16(Buffer.from(this.name())) & 0xff_ff) | 0x1_00_00).toString(16)
    }

    public computeGasConsumption(gas: {loopGasCoefficient: number}): GasConsumption {
        const body = this.node.childForFieldName("body")
        if (!body) {
            return {
                value: 0,
                unknown: true,
                exact: false,
            }
        }

        const instructions = body.children
            .filter(it => it?.type === "asm_expression")
            .filter(it => it !== null)
            .map(it => new AsmInstr(it, this.file))

        return computeGasConsumption(instructions, gas)
    }
}

export class Field extends NamedNode {
    public typeNode(): Expression | null {
        const value = this.node.childForFieldName("type")
        if (!value) return null
        return new Expression(value, this.file)
    }

    public tlbType(): string | null {
        const tlb = this.node.childForFieldName("tlb")
        if (!tlb) return null
        const type = tlb.childForFieldName("type")
        if (!type) return "" // return "" here to show that type has incomplete `as`
        return type.text
    }

    public defaultValuePresentation(): string {
        const defaultValueNode = this.node.childForFieldName("value")
        if (!defaultValueNode) return ""
        return ` = ${defaultValueNode.text}`
    }

    public owner(): StorageMembersOwner | null {
        const ownerNode = parentOfType(this.node, "trait", "contract")
        if (!ownerNode) return null

        return new StorageMembersOwner(ownerNode, this.file)
    }

    public dataOwner(): FieldsOwner | null {
        const ownerNode = parentOfType(this.node, "struct", "message", "trait", "contract")
        if (!ownerNode) return null

        return new FieldsOwner(ownerNode, this.file)
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
