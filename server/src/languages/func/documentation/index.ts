import type {Node as SyntaxNode} from "web-tree-sitter"
import * as lsp from "vscode-languageserver"
import {asLspRange} from "@server/utils/position"
import {FuncFile} from "@server/languages/func/psi/FuncFile"
import {FuncNamedNode, FuncNode} from "@server/languages/func/psi/FuncNode"
import {FuncReference} from "@server/languages/func/psi/FuncReference"
import {
    FuncFunction,
    FuncGlobalVariable,
    FuncConstant,
    FuncParameter,
    FuncVariable,
} from "@server/languages/func/psi/FuncDecls"
import {FUNC_METHOD_RETURN_TYPES} from "@server/languages/func/types/BaseTy"

export function provideFuncDocumentation(hoverNode: SyntaxNode, file: FuncFile): lsp.Hover | null {
    const doc = generateFuncDocFor(hoverNode, file)
    if (doc === null) return null

    return {
        range: asLspRange(hoverNode),
        contents: {
            kind: "markdown",
            value: doc,
        },
    }
}

function generateFuncDocFor(node: SyntaxNode, file: FuncFile): string | null {
    // Method call documentation
    if (node.type === "method_call") {
        const methodNameNode = node.childForFieldName("method_name")
        if (methodNameNode) {
            return generateMethodDocumentation(node, methodNameNode, file)
        }
    }

    if (node.type === "identifier" || node.type === "function_name") {
        // Check if this identifier is part of a method call
        if (
            node.parent?.type === "method_call" &&
            node.parent.childForFieldName("method_name")?.equals(node)
        ) {
            return generateMethodDocumentation(node.parent, node, file)
        }

        // Try to find the definition of this identifier
        const namedNode = new FuncNamedNode(node, file)
        const definition = FuncReference.resolve(namedNode)
        if (definition) {
            return generateDocForDefinition(definition)
        }

        // Provide documentation for built-in types (only for identifiers)
        if (node.type === "identifier") {
            const builtinTypes: Record<string, string> = {
                int: "Integer type - represents signed 257-bit integers",
                cell: "Cell type - represents a TVM cell containing up to 1023 bits of data and up to 4 references",
                slice: "Slice type - represents a partial view of a cell for reading data",
                builder: "Builder type - used for constructing new cells",
                cont: "Continuation type - represents a continuation (executable code)",
                tuple: "Tuple type - represents a tuple of values",
                var: "Variable type - can hold any type of value",
            }

            if (builtinTypes[node.text]) {
                return `**${node.text}**\n\n${builtinTypes[node.text]}`
            }
        }
    }

    if (node.type === "function_definition") {
        const nameNode = node.childForFieldName("name")
        if (nameNode) {
            return `**Function: ${nameNode.text}**\n\nFunction definition`
        }
    }

    return null
}

function generateMethodDocumentation(
    methodCallNode: SyntaxNode,
    methodNameNode: SyntaxNode,
    file: FuncFile,
): string | null {
    const methodName = methodNameNode.text

    // Find the object this method is called on
    const objectNode = methodCallNode.parent
    if (!objectNode) return null

    try {
        const funcNode = new FuncNode(objectNode, file)
        const objectType = funcNode.type()
        if (!objectType) return null

        const objectTypeName = objectType.name()
        const methodReturnTypes = FUNC_METHOD_RETURN_TYPES[objectTypeName]

        if (methodReturnTypes && methodReturnTypes[methodName]) {
            const returnType = methodReturnTypes[methodName]

            // Generate detailed documentation based on method type
            let doc = `**Method: ${objectTypeName}.${methodName}()**\n\n`
            doc += `**Returns:** \`${returnType}\`\n\n`

            // Add specific documentation for different method types
            if (methodName.startsWith("load_")) {
                doc += `Loads data from the ${objectTypeName} and advances the position. `
                doc += `Returns the loaded value and modifies the ${objectTypeName} when used with \`~\` operator.`
            } else if (methodName.startsWith("store_")) {
                doc += `Stores data into the ${objectTypeName}. `
                doc += `Returns the modified ${objectTypeName} for method chaining.`
            } else if (methodName.startsWith("preload_")) {
                doc += `Reads data from the ${objectTypeName} without advancing the position. `
                doc += `Does not modify the original ${objectTypeName}.`
            } else if (methodName.includes("hash")) {
                doc += `Computes the hash of the ${objectTypeName} content.`
            } else if (methodName.includes("bits") || methodName.includes("refs")) {
                doc += `Returns information about the ${objectTypeName} structure.`
            } else {
                doc += `Method of ${objectTypeName} type.`
            }

            return doc
        }

        // Handle modifying methods (with ~ operator)
        if (methodName.startsWith("~")) {
            const baseName = methodName.slice(1)
            const baseMethodReturnTypes = FUNC_METHOD_RETURN_TYPES[objectTypeName]

            if (baseMethodReturnTypes && baseMethodReturnTypes[baseName]) {
                const returnType = baseMethodReturnTypes[baseName]

                let doc = `**Modifying Method: ${objectTypeName}.${methodName}()**\n\n`
                doc += `**Returns:** \`(${objectTypeName}, ${returnType})\`\n\n`
                doc += `Modifying version that updates the original ${objectTypeName} and returns both the modified object and the result.`

                return doc
            }
        }

        return `**Method: ${objectTypeName}.${methodName}()**\n\nMethod call on ${objectTypeName} type`
    } catch {
        return `**Method: ${methodName}()**\n\nMethod call`
    }
}

function generateDocForDefinition(definition: FuncNamedNode): string {
    if (definition instanceof FuncFunction) {
        const name = definition.name()
        const returnType = definition.returnType()
        const argsNode = definition.argumentsNode()

        let doc = `**Function: ${name}**\n\n`

        // Add return type
        if (returnType) {
            doc += `**Returns:** \`${returnType.text}\`\n\n`
        }

        // Add parameters
        if (argsNode) {
            const params = argsNode.children.filter(
                child => child && child.type === "parameter_declaration",
            )
            if (params.length > 0) {
                doc += `**Parameters:**\n`
                params.forEach(param => {
                    if (param) {
                        const nameNode = param.childForFieldName("name")
                        const typeNode = param.childForFieldName("type")
                        const paramName = nameNode ? nameNode.text : "unknown"
                        const paramType = typeNode ? typeNode.text : "auto"
                        doc += `- \`${paramName}\`: ${paramType}\n`
                    }
                })
                doc += `\n`
            }
        }

        doc += `Function definition`
        return doc
    }

    if (definition instanceof FuncGlobalVariable) {
        const name = definition.name()
        const typeNode = definition.typeNode()
        const type = typeNode ? typeNode.text : "var"
        return `**Global Variable: ${name}**\n\nType: \`${type}\`\n\nA global variable accessible throughout the contract.`
    }

    if (definition instanceof FuncConstant) {
        const name = definition.name()
        const typeNode = definition.typeNode()
        const valueNode = definition.valueNode()
        const type = typeNode ? typeNode.text : "auto"
        const value = valueNode ? valueNode.text : "unknown"
        return `**Constant: ${name}**\n\nType: \`${type}\`\nValue: \`${value}\`\n\nA compile-time constant value.`
    }

    if (definition instanceof FuncParameter) {
        const name = definition.name()
        const typeNode = definition.typeNode()
        const type = typeNode ? typeNode.text : "auto"

        // Find the function this parameter belongs to
        const funcNode = definition.node.parent?.parent
        const funcName = funcNode?.childForFieldName("name")?.text || "unknown"

        return `**Parameter: ${name}**\n\nType: \`${type}\`\nFunction: \`${funcName}\`\n\nA function parameter.`
    }

    if (definition instanceof FuncVariable) {
        const name = definition.name()

        // Try to determine the type by looking at the variable declaration
        let type = "auto"
        const parent = definition.node.parent
        if (parent && parent.type === "variable_declaration") {
            const typeNode = parent.childForFieldName("type")
            if (typeNode) {
                type = typeNode.text
            }
        }

        // Find the scope this variable belongs to
        let scope = "local"
        let current = definition.node.parent
        while (current) {
            if (current.type === "function_definition") {
                const funcName = current.childForFieldName("name")?.text || "unknown"
                scope = `function \`${funcName}\``
                break
            }
            if (current.type === "block_statement") {
                scope = "block"
            }
            current = current.parent
        }

        return `**Local Variable: ${name}**\n\nType: \`${type}\`\nScope: ${scope}\n\nA local variable in the current scope.`
    }

    return `**${definition.name()}**\n\nVariable`
}
