import type {Node as SyntaxNode} from "web-tree-sitter"
import {FuncFile} from "@server/languages/func/psi/FuncFile"
import * as lsp from "vscode-languageserver"
import {FuncNamedNode} from "@server/languages/func/psi/FuncNode"
import {FuncFunction, FuncParameter} from "@server/languages/func/psi/FuncDecls"
import {FuncReference} from "@server/languages/func/psi/FuncReference"
import {File} from "@server/psi/File"
import {asParserPoint} from "@server/utils/position"
import {findFuncFile} from "@server/files"

export function provideFuncSignatureInfo(
    params: lsp.SignatureHelpParams,
): lsp.SignatureHelp | null {
    const file = findFuncFile(params.textDocument.uri)

    const hoverNode = nodeAtPosition(params, file)
    if (!hoverNode) return null

    const res = findSignatureHelpTarget(hoverNode, file)
    if (!res) return null

    const {parametersInfo, rawArguments, presentation, isMethod} = res

    // Algorithm to find active parameter by counting commas before cursor position
    // For method calls: foo.method(arg1, arg2, arg3)
    //                              ^    ^     ^
    //                              |    |     |______ argsCommas
    //                              |    |____________|
    //                              |_________________|
    //
    // To find the active parameter, find the last comma with position < cursor position.
    // Opening parenthesis is treated as comma for first parameter.

    const argsCommas = rawArguments.filter(value => value.text === "," || value.text === "(")

    let currentIndex = 0
    for (const [i, argComma] of argsCommas.entries()) {
        if (argComma.endPosition.column > params.position.character) {
            // found comma after cursor
            break
        }
        currentIndex = i
    }

    if (isMethod) {
        // skip self parameter for method calls
        currentIndex++
    }

    return {
        signatures: [
            {
                label: presentation,
                parameters: parametersInfo,
                activeParameter: currentIndex,
            },
        ],
    }
}

export function findSignatureHelpTarget(
    hoverNode: SyntaxNode,
    file: FuncFile,
): {
    rawArguments: SyntaxNode[]
    parametersInfo: lsp.ParameterInformation[]
    presentation: string
    isMethod: boolean
} | null {
    const findSignatureHelpNode = (node: SyntaxNode): SyntaxNode | null => {
        const targetNodes = new Set(["function_application", "method_call"])

        // Find parent call node
        let current: SyntaxNode | null = node
        while (current) {
            if (targetNodes.has(current.type)) {
                return current
            }
            current = current.parent
        }

        return null
    }

    const callNode = findSignatureHelpNode(hoverNode)
    if (!callNode) return null

    // Check if cursor is within the arguments area
    const args = getCallArguments(callNode)
    if (args.length === 0) return null

    const openParen = args.find(arg => arg.text === "(")
    // findLast is not available in older TypeScript, use alternative
    let closeParen: SyntaxNode | undefined
    for (let i = args.length - 1; i >= 0; i--) {
        if (args[i].text === ")") {
            closeParen = args[i]
            break
        }
    }

    if (!openParen || !closeParen) return null

    const startIndex = openParen.startIndex
    const endIndex = closeParen.endIndex

    if (hoverNode.startIndex < startIndex || hoverNode.endIndex > endIndex) {
        // Cursor is not within function arguments
        const parent = hoverNode.parent
        if (!parent) return null
        return findSignatureHelpTarget(parent, file)
    }

    // Get function name and resolve its definition
    const nameNode = getFunctionNameNode(callNode)
    if (!nameNode) return null

    const namedNode = new FuncNamedNode(nameNode, file)
    const resolved = FuncReference.resolve(namedNode)

    if (!resolved || !(resolved instanceof FuncFunction)) {
        // Try built-in function signatures
        return getBuiltinFunctionSignature(nameNode.text, args, callNode.type === "method_call")
    }

    // Get parameters from resolved function
    const parameters = getParametersFromFunction(resolved)
    const parametersInfo: lsp.ParameterInformation[] = parameters.map(param => ({
        label: param.node.text,
    }))

    const parametersString = parametersInfo.map(el => el.label).join(", ")
    const isMethod = callNode.type === "method_call"

    return {
        rawArguments: args,
        parametersInfo,
        presentation: `${resolved.name()}(${parametersString})`,
        isMethod,
    }
}

function nodeAtPosition(params: lsp.TextDocumentPositionParams, file: File): SyntaxNode | null {
    const cursorPosition = asParserPoint(params.position)
    return file.rootNode.descendantForPosition(cursorPosition)
}

function getCallArguments(callNode: SyntaxNode): SyntaxNode[] {
    if (callNode.type === "function_application") {
        const argsNode = callNode.childForFieldName("arguments")
        return argsNode
            ? argsNode.children.filter((child): child is SyntaxNode => child !== null)
            : []
    }

    if (callNode.type === "method_call") {
        const argsNode = callNode.childForFieldName("arguments")
        return argsNode
            ? argsNode.children.filter((child): child is SyntaxNode => child !== null)
            : []
    }

    return []
}

function getFunctionNameNode(callNode: SyntaxNode): SyntaxNode | null {
    if (callNode.type === "function_application") {
        return callNode.childForFieldName("function")
    }

    if (callNode.type === "method_call") {
        return callNode.childForFieldName("method_name")
    }

    return null
}

function getParametersFromFunction(func: FuncFunction): FuncParameter[] {
    const parametersNode = func.node.childForFieldName("arguments")
    if (!parametersNode) return []

    const params: FuncParameter[] = []
    for (const child of parametersNode.children) {
        if (child && child.type === "parameter_declaration") {
            params.push(new FuncParameter(child, func.file))
        }
    }

    return params
}

function getBuiltinFunctionSignature(
    functionName: string,
    args: SyntaxNode[],
    isMethod: boolean,
): {
    rawArguments: SyntaxNode[]
    parametersInfo: lsp.ParameterInformation[]
    presentation: string
    isMethod: boolean
} | null {
    // Built-in function signatures
    const builtins: Record<string, string[]> = {
        // Cell/Builder methods
        begin_cell: [],
        end_cell: ["builder"],
        store_ref: ["builder", "cell"],
        store_uint: ["builder", "int", "int"],
        store_int: ["builder", "int", "int"],
        store_slice: ["builder", "slice"],
        store_builder: ["builder", "builder"],
        load_ref: ["slice"],
        load_uint: ["slice", "int"],
        load_int: ["slice", "int"],
        preload_ref: ["slice"],
        preload_uint: ["slice", "int"],
        preload_int: ["slice", "int"],

        // Tuple methods
        tlen: ["tuple"],
        at: ["tuple", "int"],
        tpush: ["tuple", "X"],
        tpop: ["tuple"],

        // Other common functions
        throw: ["int"],
        throw_if: ["int", "int"],
        throw_unless: ["int", "int"],
    }

    const signature = builtins[functionName]
    if (!signature) return null

    const parametersInfo: lsp.ParameterInformation[] = signature.map((paramType, index) => ({
        label: `${paramType} param${index + 1}`,
    }))

    const parametersString = signature.join(", ")

    return {
        rawArguments: args,
        parametersInfo,
        presentation: `${functionName}(${parametersString})`,
        isMethod,
    }
}
