import type {Node as SyntaxNode} from "web-tree-sitter"
import * as lsp from "vscode-languageserver"
import {asLspRange} from "@server/utils/position"
import {FuncFile} from "@server/languages/func/psi/FuncFile"
import {FuncNamedNode} from "@server/languages/func/psi/FuncNode"
import {FuncReference} from "@server/languages/func/psi/FuncReference"

function asLspLocation(node: SyntaxNode, uri: string): lsp.Location {
    return lsp.Location.create(uri, asLspRange(node))
}

export function provideFuncDefinition(node: SyntaxNode, file: FuncFile): lsp.Location[] {
    // Handle method calls
    if (node.type === "method_call") {
        const methodNameNode = node.childForFieldName("method_name")
        if (methodNameNode) {
            // First try to resolve as a regular function (user-defined)
            const namedNode = new FuncNamedNode(methodNameNode, file)
            const resolved = FuncReference.resolve(namedNode)

            if (resolved) {
                const targetNode = resolved.nameNode() || resolved.node
                const location = asLspLocation(targetNode, resolved.file.uri)
                return [location]
            }

            // If not found as user-defined function, it's a built-in method
            return []
        }
    }

    // Handle identifiers and function names
    if (node.type === "identifier" || node.type === "function_name") {
        // Check if this is a method name in a method call
        if (
            node.parent?.type === "method_call" &&
            node.parent.childForFieldName("method_name")?.equals(node)
        ) {
            // This is a method call - handle through method_call logic above
            return provideFuncDefinition(node.parent, file)
        }

        const namedNode = new FuncNamedNode(node, file)
        const resolved = FuncReference.resolve(namedNode)

        if (resolved) {
            const targetNode = resolved.nameNode() || resolved.node
            const location = asLspLocation(targetNode, resolved.file.uri)
            return [location]
        }
    }

    // Handle function applications
    if (node.type === "function_application") {
        const functionNode = node.childForFieldName("function")
        if (functionNode && functionNode.type === "identifier") {
            return provideFuncDefinition(functionNode, file)
        }
    }

    return []
}
