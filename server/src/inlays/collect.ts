import {InlayHint, InlayHintKind} from "vscode-languageserver-types"
import {RecursiveVisitor} from "@server/visitor"
import {File} from "@server/psi/File"
import {TypeInferer} from "@server/TypeInferer"
import {Reference} from "@server/psi/Reference"
import {Fun} from "@server/psi/Decls"
import {CallLike, Expression, VarDeclaration} from "@server/psi/Node"
import {MapTy} from "@server/types/BaseTy"
import {findInstruction} from "@server/completion/data/types"

export function collect(
    file: File,
    hints: {
        types: boolean
        parameters: boolean
    },
): InlayHint[] | null {
    if (!hints.types && !hints.parameters) return []

    const result: InlayHint[] = []

    RecursiveVisitor.visit(file.rootNode, (n): boolean => {
        const type = n.type

        if (type === "let_statement" && hints.types) {
            const decl = new VarDeclaration(n, file)
            if (decl.hasTypeHint()) return true // already have typehint

            const expr = decl.value()
            if (!expr) return true

            const name = decl.nameIdentifier()
            if (!name) return true

            const type = TypeInferer.inferType(expr)
            if (!type) return true

            result.push({
                kind: InlayHintKind.Type,
                label: `: ${type.qualifiedName()}`,
                position: {
                    line: name.endPosition.row,
                    character: name.endPosition.column,
                },
            })
            return true
        }

        if (type === "foreach_statement" && hints.types) {
            const expr = n.childForFieldName("map")
            if (!expr) return true
            const exprTy = new Expression(expr, file).type()
            if (!(exprTy instanceof MapTy)) return true

            const key = n.childForFieldName("key")
            if (key) {
                result.push({
                    kind: InlayHintKind.Type,
                    label: `: ${exprTy.keyTy.qualifiedName()}`,
                    position: {
                        line: key.endPosition.row,
                        character: key.endPosition.column,
                    },
                })
            }

            const value = n.childForFieldName("value")
            if (value) {
                result.push({
                    kind: InlayHintKind.Type,
                    label: `: ${exprTy.valueTy.qualifiedName()}`,
                    position: {
                        line: value.endPosition.row,
                        character: value.endPosition.column,
                    },
                })
            }
            return true
        }

        if (
            (type === "static_call_expression" || type === "method_call_expression") &&
            hints.parameters
        ) {
            const call = new CallLike(n, file)
            const rawArgs = call.rawArguments()
            const args = rawArgs.filter(value => value.type === "argument")
            if (args.length === 0) return true // no parameters, no need to resolve anything

            const res = Reference.resolve(call.nameNode())
            if (!(res instanceof Fun)) return true

            const params = res.parameters()

            // skip self parameter
            const shift = type === "method_call_expression" && res.withSelf() ? 1 : 0

            for (let i = 0; i < min(params.length - shift, args.length); i++) {
                const param = params[i + shift]
                const arg = args[i]

                result.push({
                    kind: InlayHintKind.Parameter,
                    label: `${param.name()}:`,
                    position: {
                        line: arg.startPosition.row,
                        character: arg.startPosition.column,
                    },
                })
            }
            return true
        }

        if (type === "tvm_ordinary_word") {
            const instruction = findInstruction(n.text)
            if (instruction) {
                result.push({
                    kind: InlayHintKind.Type,
                    label: instruction.doc.gas,
                    position: {
                        line: n.endPosition.row,
                        character: n.endPosition.column,
                    },
                })
            }
            return true
        }

        if (type === "asm_function") {
            const func = new Fun(n, file)
            const openBrace = func.openBrace()
            if (!openBrace) return true

            const gas = func.computeGasConsumption()
            if (gas.unknown || gas.singleInstr) return true

            const presentation = gas.exact ? `${gas.value} gas` : `~${gas.value} gas`

            result.push({
                kind: InlayHintKind.Type,
                label: `  ${presentation}`,
                position: {
                    line: openBrace.endPosition.row,
                    character: openBrace.endPosition.column,
                },
            })
            return true
        }

        return true
    })

    if (result.length > 0) {
        return result
    }

    return null
}

function min<T>(a: T, b: T): T {
    return a < b ? a : b
}
