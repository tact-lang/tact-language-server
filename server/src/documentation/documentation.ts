import {Expression, NamedNode} from "../psi/Node";
import {TypeInferer} from "../TypeInferer";
import {Constant} from "../psi/TopLevelDeclarations";

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
        case "native_function":
        case "storage_function":
        case "asm_function": {
            const doc = extractCommentsDoc(node)
            const parametersNode = astNode.childForFieldName("parameters")
            if (!parametersNode) return null

            const resultNode = astNode.childForFieldName("result")
            const signatureString = parametersNode.text + (resultNode ? `: ${resultNode.nextSibling!.text}` : '');

            return defaultResult(`fun ${node.name()}${signatureString}`, doc)
        }
        case "contract": {
            const doc = extractCommentsDoc(node)
            return defaultResult(`contract ${node.name()}`, doc)
        }
        case "trait": {
            const doc = extractCommentsDoc(node)
            return defaultResult(`trait ${node.name()}`, doc)
        }
        case "struct": {
            const doc = extractCommentsDoc(node)
            return defaultResult(`struct ${node.name()}`, doc)
        }
        case "primitive": {
            const doc = extractCommentsDoc(node)
            return defaultResult(`primitive ${node.name()}`, doc)
        }
        case "global_constant":
        case "storage_constant": {
            const constant = new Constant(astNode, node.file)
            const type = constant.typeNode()?.type()?.qualifiedName() ?? 'unknown'
            if (!type) return null

            const value = constant.value()
            if (!value) return null

            const doc = extractCommentsDoc(node)
            return defaultResult(`const ${node.name()}: ${type} = ${value.node.text}`, doc)
        }
        case "storage_variable":
        case "field": {
            const doc = extractCommentsDoc(node)
            const typeNode = astNode.childForFieldName("type")
            if (!typeNode) return null

            const type = new Expression(typeNode, node.file).type()?.qualifiedName() ?? "unknown"

            const defaultValueNode = astNode.childForFieldName("value")
            let defaultValue = defaultValueNode?.text ?? ''
            if (defaultValue != '') {
                defaultValue = ` = ${defaultValue}`
            }

            return defaultResult(`${node.name()}: ${type}${defaultValue}`, doc)
        }
        case "identifier": {
            const decl = astNode.parent
            if (!decl) return null
            const valueNode = decl.childForFieldName("value")
            if (!valueNode) return null

            const type = TypeInferer.inferType(node)
            const typeName = type?.qualifiedName() ?? "unknown"
            return defaultResult(`let ${node.name()}: ${typeName} = ${valueNode.text}`)
        }
        case "parameter": {
            const type = TypeInferer.inferType(node)
            const typeName = type?.qualifiedName() ?? "unknown"
            return defaultResult(`${node.name()}: ${typeName}`)
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
