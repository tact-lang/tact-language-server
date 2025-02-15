import {InlayHint, InlayHintKind} from "vscode-languageserver-types"
import {RecursiveVisitor} from "@server/psi/visitor"
import type {File} from "@server/psi/File"
import {TypeInferer} from "@server/TypeInferer"
import {Reference} from "@server/psi/Reference"
import {Field, Fun, InitFunction} from "@server/psi/Decls"
import {AsmInstr, CallLike, Expression, NamedNode, VarDeclaration} from "@server/psi/Node"
import {MapTy} from "@server/types/BaseTy"
import type {Node as SyntaxNode} from "web-tree-sitter"
import {computeGasConsumption, GasConsumption} from "@server/asm/gas"
import * as compiler from "@server/compiler/utils"

function processParameterHints(
    shift: number,
    params: NamedNode[],
    args: SyntaxNode[],
    result: InlayHint[],
): void {
    for (let i = 0; i < Math.min(params.length - shift, args.length); i++) {
        const param = params[i + shift]
        const arg = args[i]
        const paramName = param.name()

        if (paramName.length === 1) {
            // don't show hints for single letter parameters
            continue
        }

        if (arg.text === paramName || arg.text.endsWith(`.${paramName}`)) {
            // no need to add hint for `takeFoo(foo)` or `takeFoo(val.foo)`
            continue
        }

        if (arg.children[0]?.type === "instance_expression") {
            // no need to add hint for `takeFoo(Foo{})`
            continue
        }

        result.push({
            kind: InlayHintKind.Parameter,
            label: `${paramName}:`,
            position: {
                line: arg.startPosition.row,
                character: arg.startPosition.column,
            },
        })
    }
}

function getStackPresentation(rawStack: string | undefined): string {
    if (!rawStack) return ""
    const trimmedStack = rawStack.trim()
    const prefix = trimmedStack.startsWith("-") ? "∅ " : ""
    const suffix = trimmedStack.endsWith("-") ? " ∅" : ""
    const stack = prefix + rawStack.replace("-", "→") + suffix
    return `(${stack})`
}

function instructionPresentation(
    gas: string | undefined,
    stack: string | undefined,
    format: string,
): string {
    if (!gas || gas === "") {
        return ": no data"
    }
    return format.replace("{gas}", gas).replace("{stack}", getStackPresentation(stack))
}

function calculatePushcontGas(instr: AsmInstr, file: File): GasConsumption | null {
    const args = instr.arguments()
    if (args.length === 0) return null

    const arg = args[0]
    if (arg.type !== "asm_sequence") return null

    const instructions = arg.children
        .filter(it => it?.type === "asm_expression")
        .filter(it => it !== null)
        .map(it => new AsmInstr(it, file))

    return computeGasConsumption(instructions)
}

export function collect(
    file: File,
    hints: {
        types: boolean
        parameters: boolean
        exitCodeFormat: "decimal" | "hex"
        showMethodId: boolean
        showGasConsumption: boolean
        showAsmInstructionGas: boolean
        showExitCodes: boolean
        showExplicitTLBIntType: boolean
        gasFormat: string
        showPushcontGas: boolean
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

            // don't show hint for:
            // let params = SomeParams{}
            if (expr.node.type === "instance_expression") return true

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

        if ((type === "field" || type === "storage_variable") && hints.showExplicitTLBIntType) {
            const field = new Field(n, file)
            const typeNode = field.typeNode()
            if (!typeNode) return true
            const type = typeNode.type()
            if (!type) return true

            const fieldTlb = field.tlbType()
            if (fieldTlb !== null) return true

            const addHint = (node: SyntaxNode): void => {
                result.push({
                    kind: InlayHintKind.Type,
                    label: ` as int257`,
                    position: {
                        line: node.endPosition.row,
                        character: node.endPosition.column,
                    },
                })
            }

            if (type.name() === "Int") {
                addHint(typeNode.node)
            }

            if (type instanceof MapTy) {
                const tlbKey = typeNode.node.childForFieldName("tlb_key")
                const tlbValue = typeNode.node.childForFieldName("tlb_value")

                if (tlbKey === null) {
                    const key = typeNode.node.childForFieldName("key")
                    if (key?.text === "Int") {
                        addHint(key)
                    }
                }

                if (tlbValue === null) {
                    const value = typeNode.node.childForFieldName("value")
                    if (value?.text === "Int") {
                        addHint(value)
                    }
                }
            }
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

        if (type === "catch_clause") {
            const name = n.childForFieldName("name")
            if (!name) return true
            const exprTy = new Expression(name, file).type()
            if (!exprTy) return true

            result.push({
                kind: InlayHintKind.Type,
                label: `: ${exprTy.qualifiedName()}`,
                position: {
                    line: name.endPosition.row,
                    character: name.endPosition.column,
                },
            })
        }

        if (
            (type === "static_call_expression" || type === "method_call_expression") &&
            hints.parameters &&
            hints.showExitCodes
        ) {
            const call = new CallLike(n, file)
            const rawArgs = call.rawArguments()
            const args = rawArgs.filter(value => value.type === "argument")
            if (args.length === 0) return true // no arguments, no need to resolve anything

            const res = Reference.resolve(call.nameNode())
            if (!(res instanceof Fun)) return true

            const params = res.parameters()

            // We want to show the actual exit code for message in require
            // require(true, "message")
            // =>
            // require(true, "message" exit code: 999)
            if (call.name() === "require") {
                const exitCode = compiler.requireFunctionExitCode(n, file, hints.exitCodeFormat)
                if (exitCode !== null) {
                    result.push({
                        kind: InlayHintKind.Parameter,
                        label: ` exit code: ${exitCode.value}`,
                        position: {
                            line: exitCode.node.endPosition.row,
                            character: exitCode.node.endPosition.column,
                        },
                    })
                }
            }

            // skip self parameter
            const shift = type === "method_call_expression" && res.withSelf() ? 1 : 0

            processParameterHints(shift, params, args, result)
            return true
        }

        if (type === "initOf" && n.text !== "initOf" && hints.parameters) {
            const call = new CallLike(n, file)
            const rawArgs = call.rawArguments()
            const args = rawArgs.filter(value => value.type === "argument")
            if (args.length === 0) return true // no arguments, no need to resolve anything

            // initOf Contract(10)
            // ^^^^^^
            const initOfToken = n.firstChild
            if (!initOfToken) return true

            // init(some: Int)
            // ^^^^
            const res = Reference.resolve(new NamedNode(initOfToken, file))
            if (res?.node.type !== "init") return true

            // init(some: Int)
            // ^^^^^^^^^^^^^^^
            const parent = res.node.parent
            if (!parent) return true

            const init = new InitFunction(parent, file)
            const params = init.parameters()

            processParameterHints(0, params, args, result)
            return true
        }

        if (type === "asm_expression" && hints.showAsmInstructionGas) {
            const instr = new AsmInstr(n, file)
            const info = instr.info()

            if (instr.name() === "PUSHCONT" && hints.showPushcontGas) {
                const gas = calculatePushcontGas(instr, file)
                if (!gas) return true

                const openBrace = instr.arguments()[0].firstChild
                if (!openBrace) return true

                result.push({
                    kind: InlayHintKind.Type,
                    label: instructionPresentation(gas.value.toString(), "", hints.gasFormat),
                    position: {
                        line: openBrace.endPosition.row,
                        character: openBrace.endPosition.column,
                    },
                    paddingLeft: true,
                })
            }

            const presentation = instructionPresentation(
                info?.doc.gas,
                info?.doc.stack,
                hints.gasFormat,
            )

            result.push({
                kind: InlayHintKind.Type,
                label: presentation,
                position: {
                    line: n.endPosition.row,
                    character: n.endPosition.column,
                },
                paddingLeft: true,
            })
            return true
        }

        if (type === "asm_function" && hints.showGasConsumption) {
            const func = new Fun(n, file)
            const openBrace = func.openBrace()
            if (!openBrace) return true

            const gas = func.computeGasConsumption()
            if (gas.unknown || gas.singleInstr || gas.value === 0) return true

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

        if (type === "storage_function" && hints.showMethodId) {
            const func = new Fun(n, file)
            if (!func.isGetMethod) return true

            const modifiers = n.childForFieldName("attributes")
            if (!modifiers) return true

            const actualId = func.computeMethodId()
            const actualIdHex = actualId.toString(16)

            result.push({
                kind: InlayHintKind.Type,
                label: `(0x${actualIdHex})`,
                position: {
                    line: modifiers.endPosition.row,
                    character: modifiers.endPosition.column,
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
