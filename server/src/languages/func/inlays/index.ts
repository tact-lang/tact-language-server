import {InlayHint, InlayHintKind} from "vscode-languageserver-types"
import {RecursiveVisitor} from "@server/languages/tact/psi/visitor"
import type {FuncFile} from "@server/languages/func/psi/FuncFile"
import {FuncNamedNode} from "@server/languages/func/psi/FuncNode"
import {FuncFunction, FuncParameter} from "@server/languages/func/psi/FuncDecls"
import {FuncReference} from "@server/languages/func/psi/FuncReference"
import type {Node as SyntaxNode} from "web-tree-sitter"
import { Location} from "vscode-languageserver"
import {asLspRange} from "@server/utils/position"

function processParameterHints(
    shift: number,
    params: FuncParameter[],
    args: SyntaxNode[],
    result: InlayHint[],
    file: FuncFile,
): void {
    if (params.length === 0) return

    if (params.length === 1) {
        // don't add extra noise for unary functions
        return
    }

    for (let i = 0; i < Math.min(params.length - shift, args.length); i++) {
        const param = params[i + shift]
        const arg = args[i]
        const paramName = param.name()

        if (paramName.length === 1) {
            // don't show hints for single letter parameters
            continue
        }

        if (arg.text === paramName || arg.text.endsWith(`.${paramName}`)) {
            // no need to add a hint for `takeFoo(foo)` or `takeFoo(val.foo)`
            continue
        }

        const argExpr = arg.children[0]
        if (!argExpr) continue

        if (argExpr.type === "function_application") {
            const name = argExpr.childForFieldName("function")
            if (paramName === name?.text) {
                // no need to add a hint for `takeSender(sender())`
                continue
            }
        }

        if (argExpr.type === "method_call") {
            const name = argExpr.childForFieldName("method_name")
            if (paramName === name?.text) {
                // no need to add a hint for `takeSender(foo.sender())`
                continue
            }
        }

        result.push({
            kind: InlayHintKind.Parameter,
            label: [
                {
                    value: paramName,
                    location: toLocation(param.nameNode(), file),
                },
                {
                    value: ":",
                },
            ],
            position: {
                line: arg.startPosition.row,
                character: arg.startPosition.column,
            },
        })
    }
}

function toLocation(node: SyntaxNode | null, file: FuncFile): Location | undefined {
    if (!node) return undefined

    return {
        uri: file.uri,
        range: asLspRange(node),
    }
}

export function collectFuncInlays(
    file: FuncFile,
    hints: {
        parameters: boolean
    },
): InlayHint[] | null {
    if (!hints.parameters) return []

    const result: InlayHint[] = []

    RecursiveVisitor.visit(file.rootNode, (n): boolean => {
        const type = n.type

        if ((type === "function_application" || type === "method_call") && hints.parameters) {
            const rawArgs = getCallArguments(n)
            const args = rawArgs.filter(
                value =>
                    value.type === "argument" ||
                    (value.type !== "(" && value.type !== ")" && value.type !== ","),
            )

            if (args.length === 0) return true // no arguments, no need to resolve anything

            const nameNode = getFunctionNameNode(n)
            if (!nameNode) return true

            const namedNode = new FuncNamedNode(nameNode, file)
            const resolved = FuncReference.resolve(namedNode)

            if (!(resolved instanceof FuncFunction)) {
                // Try built-in function parameter hints
                processBuiltinParameterHints(nameNode.text, args, result, type === "method_call")
                return true
            }

            const params = getParametersFromFunction(resolved)

            // skip self parameter for method calls
            const shift = type === "method_call" ? 0 : 0 // FunC doesn't have self parameters like Tact

            processParameterHints(shift, params, args, result, file)
            return true
        }

        return true
    })

    return result
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

function processBuiltinParameterHints(
    functionName: string,
    args: SyntaxNode[],
    result: InlayHint[],
    isMethod: boolean,
): void {
    // Built-in function parameter names
    const builtinParams: Record<string, string[]> = {
        // Cell/Builder methods
        store_ref: ["cell"],
        store_uint: ["value", "bits"],
        store_int: ["value", "bits"],
        store_slice: ["slice"],
        store_builder: ["builder"],
        load_uint: ["bits"],
        load_int: ["bits"],
        preload_uint: ["bits"],
        preload_int: ["bits"],

        // Tuple methods
        at: ["index"],
        tpush: ["value"],

        // Other common functions
        throw: ["exit_code"],
        throw_if: ["exit_code", "condition"],
        throw_unless: ["exit_code", "condition"],
    }

    const paramNames = builtinParams[functionName]
    if (!paramNames) return

    for (let i = 0; i < Math.min(paramNames.length, args.length); i++) {
        const paramName = paramNames[i]
        const arg = args[i]

        if (paramName.length === 1) {
            // don't show hints for single letter parameters
            continue
        }

        if (arg.text === paramName) {
            // no need to add a hint if argument name matches parameter name
            continue
        }

        result.push({
            kind: InlayHintKind.Parameter,
            label: [
                {
                    value: paramName,
                },
                {
                    value: ":",
                },
            ],
            position: {
                line: arg.startPosition.row,
                character: arg.startPosition.column,
            },
        })
    }
}
