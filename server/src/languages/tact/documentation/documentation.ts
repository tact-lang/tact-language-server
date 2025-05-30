//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import {NamedNode, TactNode} from "@server/languages/tact/psi/TactNode"
import {TypeInferer} from "@server/languages/tact/TypeInferer"
import {
    Constant,
    Contract,
    Field,
    FieldsOwner,
    Fun,
    InitFunction,
    Message,
    MessageFunction,
    Struct,
    Trait,
} from "@server/languages/tact/psi/Decls"
import type {Node as SyntaxNode} from "web-tree-sitter"
import {trimPrefix} from "@server/utils/strings"
import * as compiler from "@server/languages/tact/compiler/utils"
import {getDocumentSettings, TactSettings} from "@server/settings/settings"
import {TactFile} from "@server/languages/tact/psi/TactFile"
import {
    ContractTy,
    FieldsOwnerTy,
    MessageTy,
    sizeOfPresentation,
    StructTy,
    Ty,
} from "@server/languages/tact/types/BaseTy"
import {generateTlb} from "@server/languages/tact/compiler/tlb/tlb"

const CODE_FENCE = "```"
const DOC_TMPL = `${CODE_FENCE}tact\n{signature}\n${CODE_FENCE}\n{documentation}\n`
export const tactCodeBlock = (s: string): string => `${CODE_FENCE}tact\n${s}\n${CODE_FENCE}`

/**
 * Returns the documentation for the given symbol in Markdown format, or null
 * if there is no documentation for the element.
 * @param node for which we need documentation
 * @param place where symbol is used
 */
export async function generateDocFor(node: NamedNode, place: SyntaxNode): Promise<string | null> {
    const settings = await getDocumentSettings(node.file.uri)
    const maxLinesBody = settings.documentation.maximumLinesBodyToShowInDocumentation
    const astNode = node.node

    function renderOwnerPresentation(symbol: Fun | Constant | Field): string | null {
        const owner = symbol.owner()
        if (!owner) return null // not possible in correct code
        return owner.kind() + " " + owner.name() + "\n"
    }

    function renderDataOwnerPresentation(symbol: Field): string | null {
        const owner = symbol.dataOwner()
        if (!owner) return null // not possible in correct code
        return owner.kind() + " " + owner.name() + "\n"
    }

    function genTlb(ty: Ty): string {
        if (!settings.documentation.showTlb) return ""

        const tlb = generateTlb(ty)
        return `\n---\n\n**TL-B:**\n\n${CODE_FENCE}tlb\n${tlb}\n${CODE_FENCE}\n\n`
    }

    switch (astNode.type) {
        case "native_function": {
            const func = new Fun(astNode, node.file)
            const doc = node.documentation()
            const nameAttr = func.nameAttribute()
            const nameAttrText = nameAttr ? `${nameAttr.text}\n` : ""

            return defaultResult(
                `${nameAttrText}${func.modifiers()}native ${node.name()}${func.signaturePresentation()}`,
                doc,
            )
        }
        case "global_function": {
            const func = new Fun(astNode, node.file)
            const doc = node.documentation()

            const extraDoc =
                func.name() === "require" ? requireFunctionDoc(place, node.file, settings) : ""

            const name = trimPrefix(
                trimPrefix(trimPrefix(node.name(), "AnyContract_"), "AnyMessage_"),
                "AnyStruct_",
            )

            return defaultResult(
                `${func.modifiers()}fun ${name}${func.signaturePresentation()}${func.bodyPresentation(maxLinesBody)}`,
                extraDoc + doc,
            )
        }
        case "storage_function": {
            const func = new Fun(astNode, node.file)
            const doc = node.documentation()
            const ownerPresentation = renderOwnerPresentation(func)
            if (!ownerPresentation) return null // not possible in correct code

            const actualId = func.computeMethodId()
            const actualIdPresentation = `Method ID: \`${actualId}\`\n\n`

            const idPresentation = func.isGetMethod ? actualIdPresentation : ""

            return defaultResult(
                `${ownerPresentation}${func.modifiers()}fun ${node.name()}${func.signaturePresentation()}${func.bodyPresentation(maxLinesBody)}`,
                idPresentation + doc,
            )
        }
        case "asm_function": {
            const func = new Fun(astNode, node.file)
            const doc = node.documentation()

            const gas = await func.computeGasConsumption(settings.gas)

            const presentation = gas.exact ? gas.value.toString() : `~${gas.value}`
            const gasPresentation = gas.unknown ? "" : `Gas: \`${presentation}\``

            return defaultResult(
                `${func.modifiers()}fun ${node.name()}${func.signaturePresentation()}${func.bodyPresentation(maxLinesBody)}`,
                gasPresentation + "\n\n" + doc,
            )
        }
        case "contract": {
            const contract = new Contract(astNode, node.file)
            const inherited = contract
                .inheritTraits()
                .map(it => it.name())
                .filter(it => it !== "BaseTrait")
                .join(", ")
            const inheritedString = inherited.length > 0 ? ` with ${inherited}` : ``
            const doc = node.documentation()

            const init = contract.initFunction()

            const members = generateMembers([
                contract.ownFields(),
                init === null ? [] : [init],
                contract.messageFunctions(),
                contract.ownMethods().filter(it => it.isGetMethod),
            ])

            const body = members === "" ? "{}" : `{\n${members}\n}`

            const tlb = genTlb(new ContractTy(contract.name(), contract))

            return defaultResult(`contract ${node.name()}${inheritedString} ${body}`, tlb + doc)
        }
        case "trait": {
            const trait = new Trait(astNode, node.file)
            const inherited = trait
                .inheritTraits()
                .map(it => it.name())
                .filter(it => it !== "BaseTrait")
                .join(", ")
            const inheritedString = inherited.length > 0 ? ` with ${inherited}` : ``
            const doc = node.documentation()

            const members = generateMembers([
                trait.ownConstants(),
                trait.ownFields(),
                trait.ownMethods(),
            ])

            const body = members === "" ? "{}" : `{\n${members}\n}`
            return defaultResult(`trait ${node.name()}${inheritedString} ${body}`, doc)
        }
        case "struct": {
            const doc = node.documentation()
            const struct = new Struct(node.node, node.file)
            const body = struct.body()?.text ?? ""
            const sizeDoc = documentationSizeOf(struct)
            const tlb = genTlb(new StructTy(struct.name(), struct))

            return defaultResult(`struct ${node.name()} ${body}`, tlb + sizeDoc + doc)
        }
        case "message": {
            const doc = node.documentation()
            const message = new Message(node.node, node.file)
            const body = message.body()?.text ?? ""
            const opcode = message.opcode()
            const opcodePresentation = opcode ? `(${opcode})` : ""
            const sizeDoc = documentationSizeOf(message)
            const tlb = genTlb(new MessageTy(message.name(), message))

            return defaultResult(
                `message${opcodePresentation} ${node.name()} ${body}`,
                tlb + sizeDoc + doc,
            )
        }
        case "primitive": {
            const doc = node.documentation()
            return defaultResult(`primitive ${node.name()}`, doc)
        }
        case "global_constant": {
            const constant = new Constant(astNode, node.file)
            const type = constant.typeNode()?.type()?.qualifiedName() ?? "unknown"
            if (!type) return null

            const value = constant.value()
            if (!value) return null

            const doc = node.documentation()
            return defaultResult(
                `${constant.modifiers()}const ${node.name()}: ${type} = ${value.node.text}`,
                doc,
            )
        }
        case "storage_constant": {
            const constant = new Constant(astNode, node.file)
            const type = constant.typeNode()?.type()?.qualifiedName() ?? "unknown"
            if (!type) return null

            const ownerPresentation = renderOwnerPresentation(constant)
            if (!ownerPresentation) return null // not possible in correct code

            const value = constant.value()
            if (!value) return null

            const doc = node.documentation()
            return defaultResult(
                `${ownerPresentation}${constant.modifiers()}const ${node.name()}: ${type} = ${value.node.text}`,
                doc,
            )
        }
        case "storage_variable": {
            const doc = node.documentation()
            const field = new Field(node.node, node.file)

            const ownerPresentation = renderOwnerPresentation(field)
            if (!ownerPresentation) return null // not possible in correct code

            const name = field.nameNode()
            if (!name) return null

            const type = TypeInferer.inferType(name)?.qualifiedName() ?? "unknown"

            return defaultResult(
                `${ownerPresentation}${node.name()}: ${type}${field.defaultValuePresentation()}`,
                doc,
            )
        }
        case "field": {
            const doc = node.documentation()
            const field = new Field(node.node, node.file)

            const ownerPresentation = renderDataOwnerPresentation(field)
            if (!ownerPresentation) return null // not possible in correct code

            const name = field.nameNode()
            if (!name) return null

            const type = TypeInferer.inferType(name)?.qualifiedName() ?? "unknown"

            return defaultResult(
                `${ownerPresentation}${node.name()}: ${type}${field.defaultValuePresentation()}`,
                doc,
            )
        }
        case "identifier": {
            const parent = astNode.parent
            if (!parent) return null

            if (parent.type === "let_statement") {
                const valueNode = parent.childForFieldName("value")
                if (!valueNode) return null

                const type = TypeInferer.inferType(node)
                const typeName = type?.qualifiedName() ?? "unknown"
                return defaultResult(`let ${node.name()}: ${typeName} = ${valueNode.text}`)
            }

            if (parent.type === "foreach_statement") {
                const type = TypeInferer.inferType(node)
                const typeName = type?.qualifiedName() ?? "unknown"
                return defaultResult(`let ${node.name()}: ${typeName}`)
            }

            if (parent.type === "catch_clause") {
                return defaultResult(`catch(${node.name()})`)
            }
            break
        }
        case "parameter": {
            const type = TypeInferer.inferType(node)
            const typeName = type?.qualifiedName() ?? "unknown"

            if (astNode.parent?.parent?.type === "contract") {
                const field = new Field(node.node, node.file)
                const ownerPresentation = renderOwnerPresentation(field)
                if (!ownerPresentation) return null // not possible in correct code

                const name = field.nameNode()
                if (!name) return null

                const type = TypeInferer.inferType(name)?.qualifiedName() ?? "unknown"

                return defaultResult(
                    `${ownerPresentation}${node.name()}: ${type}${field.defaultValuePresentation()}`,
                    "",
                )
            }

            return defaultResult(`${node.name()}: ${typeName}`)
        }
    }

    return null
}

function generateMembers(nodes: TactNode[][]): string {
    const parts = nodes
        .map(nodesPars =>
            nodesPars
                .map(it => generateMemberDocFor(it))
                .filter(it => it !== null)
                .map(it => `    ${it}`)
                .join("\n"),
        )
        .filter(it => it !== "")
    return parts.join("\n\n")
}

function generateMemberDocFor(node: TactNode): string | null {
    const astNode = node.node
    switch (astNode.type) {
        case "storage_function": {
            const func = new Fun(astNode, node.file)
            return `${func.modifiers()}fun ${func.name()}${func.signaturePresentation()};`
        }
        case "storage_constant": {
            const constant = new Constant(astNode, node.file)
            const type = constant.typeNode()?.type()?.qualifiedName() ?? "unknown"
            if (!type) return null

            const value = constant.value()
            if (!value) return null

            return `${constant.modifiers()}const ${constant.name()}: ${type} = ${value.node.text};`
        }
        case "storage_variable": {
            const name = astNode.childForFieldName("name")
            if (!name) return null

            const field = new Field(name, node.file)
            const type = TypeInferer.inferType(field)?.qualifiedName() ?? "unknown"

            return `${field.name()}: ${type}${field.defaultValuePresentation()};`
        }
        case "init_function": {
            const func = new InitFunction(astNode, node.file)
            return func.nameLike() + ";"
        }
        case "receive_function":
        case "external_function":
        case "bounced_function": {
            const func = new MessageFunction(astNode, node.file)
            return func.nameLike() + ";"
        }
        case "parameter": {
            const field = new Field(node.node, node.file)
            const name = field.nameNode()
            if (!name) return null
            const type = TypeInferer.inferType(name)?.qualifiedName() ?? "unknown"
            return `${name.name()}: ${type}${field.defaultValuePresentation()};`
        }
    }

    return null
}

function requireFunctionDoc(
    place: SyntaxNode,
    file: TactFile,
    settings: TactSettings,
): string | null {
    const callNode = place.parent
    if (!callNode) return null

    const exitCode = compiler.requireFunctionExitCode(callNode, file, settings.hints.exitCodeFormat)
    if (!exitCode) return ""
    return `Exit code: **${exitCode.value}**.\n\n`
}

function documentationSizeOf(fieldsOwner: FieldsOwner): string {
    const ty = new FieldsOwnerTy(fieldsOwner.name(), fieldsOwner)
    const sizeOf = ty.sizeOf()
    if (!sizeOf.valid) return ""
    const sizeOfPres = sizeOfPresentation(sizeOf)
    return `**Size:** ${sizeOfPres}.\n\n---\n\n`
}

function defaultResult(signature: string, documentation: string = ""): string {
    return DOC_TMPL.replace("{signature}", signature).replace("{documentation}", documentation)
}
