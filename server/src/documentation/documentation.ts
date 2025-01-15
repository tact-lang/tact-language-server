import {Expression, NamedNode} from "../psi/Node";
import {TypeInferer} from "../TypeInferer";

const CODE_FENCE = "```"
const DOC_TMPL = `${CODE_FENCE}\n{signature}\n${CODE_FENCE}\n{documentation}\n`

/**
 * Returns the documentation for the given symbol in Markdown format, or null
 * if there is no documentation for the element.
 * @param node for which we need documentation
 */
export function generateDocFor(node: NamedNode): string | null {
    const astNode = node.node;
    switch (astNode.type) {
        case "global_function":
        case "asm_function": {
            const doc = extractCommentsDoc(node)
            const parametersNode = astNode.childForFieldName("parameters")
            if (!parametersNode) return null

            let signatureString = parametersNode.text
            const resultNode = astNode.childForFieldName("result")
            if (resultNode) {
                signatureString += `: ${resultNode.nextSibling!.text}`
            }

            return defaultResult(`fun ${node.name()}${signatureString}`, doc)
        }
        case "struct": {
            const doc = extractCommentsDoc(node)
            return defaultResult(`struct ${node.name()}`, doc)
        }
        case "field": {
            const doc = extractCommentsDoc(node)
            const typeNode = astNode.childForFieldName("type")
            if (!typeNode) return null

            const type = TypeInferer.inferType(new Expression(typeNode, node.file))
            const typeName = type?.qualifiedName() ?? "unknown"

            const defaultValueNode = astNode.childForFieldName("value")
            let defaultValue = defaultValueNode?.text ?? ''
            if (defaultValue != '') {
                defaultValue = ` = ${defaultValue}`
            }

            return defaultResult(`${node.name()}: ${typeName}${defaultValue}`, doc)
        }
        case "let_statement": {
            const valueNode = astNode.childForFieldName("value")
            if (!valueNode) return null

            const type = TypeInferer.inferType(node)
            const typeName = type?.qualifiedName() ?? "unknown"
            return defaultResult(`let ${node.name()}: ${typeName} = ${valueNode.text}`)
        }
    }

    return null
}

function extractCommentsDoc(node: NamedNode): string {
    return '' // TODO
}

function defaultResult(signature: string, documentation: string = "") {
    return DOC_TMPL
        .replace("{signature}", signature)
        .replace("{documentation}", documentation)
}
