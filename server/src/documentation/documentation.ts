import {NamedNode, Node} from "@server/psi/Node"
import {TypeInferer} from "@server/TypeInferer"
import {Constant, Contract, Field, Fun, Message, Struct, Trait} from "@server/psi/Decls"
import type {Node as SyntaxNode} from "web-tree-sitter"
import {trimPrefix} from "@server/utils/strings"

const CODE_FENCE = "```"
const DOC_TMPL = `${CODE_FENCE}tact\n{signature}\n${CODE_FENCE}\n{documentation}\n`
export const tactCodeBlock = (s: string): string => `${CODE_FENCE}tact\n${s}\n${CODE_FENCE}`

/**
 * Returns the documentation for the given symbol in Markdown format, or null
 * if there is no documentation for the element.
 * @param node for which we need documentation
 */
export function generateDocFor(node: NamedNode): string | null {
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

    switch (astNode.type) {
        case "native_function": {
            const func = new Fun(astNode, node.file)
            const doc = extractCommentsDoc(node)
            const nameAttr = func.nameAttribute()
            const nameAttrText = nameAttr ? `${nameAttr.text}\n` : ""

            return defaultResult(
                `${nameAttrText}${func.modifiers()}native ${node.name()}${func.signaturePresentation()}`,
                doc,
            )
        }
        case "global_function": {
            const func = new Fun(astNode, node.file)
            const doc = extractCommentsDoc(node)

            const name = trimPrefix(trimPrefix(node.name(), "AnyMessage_"), "AnyStruct_")

            return defaultResult(
                `${func.modifiers()}fun ${name}${func.signaturePresentation()}`,
                doc,
            )
        }
        case "storage_function": {
            const func = new Fun(astNode, node.file)
            const doc = extractCommentsDoc(node)
            const ownerPresentation = renderOwnerPresentation(func)
            if (!ownerPresentation) return null // not possible in correct code

            const actualId = func.computeMethodId()
            const actualIdPresentation = `Method ID: \`0x${actualId.toString(16)}\`\n\n`

            const idPresentation = func.isGetMethod ? actualIdPresentation : ""

            return defaultResult(
                `${ownerPresentation}${func.modifiers()}fun ${node.name()}${func.signaturePresentation()}`,
                idPresentation + doc,
            )
        }
        case "asm_function": {
            const func = new Fun(astNode, node.file)
            const doc = extractCommentsDoc(node)

            const bodyPresentation = func.hasOneLineBody ? ` ${func.bodyPresentation}` : ""
            const gas = func.computeGasConsumption()

            const presentation = gas.exact ? gas.value.toString() : `~${gas.value}`
            const gasPresentation = gas.unknown ? "" : `Gas: \`${presentation}\``

            return defaultResult(
                `${func.modifiers()}fun ${node.name()}${func.signaturePresentation()}${bodyPresentation}`,
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
            const doc = extractCommentsDoc(node)

            return defaultResult(`contract ${node.name()}${inheritedString}`, doc)
        }
        case "trait": {
            const trait = new Trait(astNode, node.file)
            const inherited = trait
                .inheritTraits()
                .map(it => it.name())
                .filter(it => it !== "BaseTrait")
                .join(", ")
            const inheritedString = inherited.length > 0 ? ` with ${inherited}` : ``
            const doc = extractCommentsDoc(node)

            return defaultResult(`trait ${node.name()}${inheritedString}`, doc)
        }
        case "struct": {
            const doc = extractCommentsDoc(node)
            const struct = new Struct(node.node, node.file)
            const body = struct.body()?.text ?? ""
            return defaultResult(`struct ${node.name()} ${body}`, doc)
        }
        case "message": {
            const doc = extractCommentsDoc(node)
            const message = new Message(node.node, node.file)
            const body = message.body()?.text ?? ""
            const value = message.value()
            return defaultResult(`message${value} ${node.name()} ${body}`, doc)
        }
        case "primitive": {
            const doc = extractCommentsDoc(node)
            return defaultResult(`primitive ${node.name()}`, doc)
        }
        case "global_constant": {
            const constant = new Constant(astNode, node.file)
            const type = constant.typeNode()?.type()?.qualifiedName() ?? "unknown"
            if (!type) return null

            const value = constant.value()
            if (!value) return null

            const doc = extractCommentsDoc(node)
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

            const doc = extractCommentsDoc(node)
            return defaultResult(
                `${ownerPresentation}${constant.modifiers()}const ${node.name()}: ${type} = ${value.node.text}`,
                doc,
            )
        }
        case "storage_variable": {
            const doc = extractCommentsDoc(node)
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
            const doc = extractCommentsDoc(node)
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
            return defaultResult(`${node.name()}: ${typeName}`)
        }
    }

    return null
}

export function extractCommentsDoc(node: Node): string {
    const prevSibling = node.node.previousSibling
    if (!prevSibling || prevSibling.type !== "comment") return ""

    const comments: SyntaxNode[] = []
    let comment: SyntaxNode | null = prevSibling
    while (comment?.type === "comment") {
        const nodeStartLine = node.node.startPosition.row
        const commentStartLine = comment.startPosition.row

        if (commentStartLine + 1 + comments.length != nodeStartLine) {
            break
        }

        comments.push(comment)
        comment = comment.previousSibling
    }

    const finalComments = comments.reverse()

    const lines = finalComments.map(c =>
        trimPrefix(trimPrefix(trimPrefix(c.text, "///"), "//"), " ").trimEnd(),
    )

    let result = ""
    let insideCodeBlock = false

    for (const rawLine of lines) {
        const line = rawLine.trimEnd()

        if (line.replace(/-/g, "").length === 0 && line.length > 0) {
            result += "\n\n"
            continue
        }

        const isEndOfSentence = /[!.:?]$/.test(line)
        const isList = line.startsWith("-") || line.startsWith("*")
        const isHeader = line.startsWith("#")
        const isTable = line.startsWith("|")
        const isCodeBlock = line.startsWith("```")

        if (isCodeBlock && !insideCodeBlock) {
            result += "\n"
        }

        result += line

        if (insideCodeBlock || isCodeBlock || isTable) {
            result += "\n"
        }

        if ((isEndOfSentence || isList || isHeader) && !insideCodeBlock) {
            result += "\n\n"
        } else if (!insideCodeBlock && !isCodeBlock) {
            result += " "
        }

        if (isCodeBlock) {
            insideCodeBlock = !insideCodeBlock
        }
    }

    return result.trimEnd()
}

function defaultResult(signature: string, documentation: string = ""): string {
    return DOC_TMPL.replace("{signature}", signature).replace("{documentation}", documentation)
}
