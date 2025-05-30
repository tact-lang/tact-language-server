//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import {InlayHint, InlayHintKind} from "vscode-languageserver-types"
import {AsyncRecursiveVisitor} from "@server/languages/tact/psi/visitor"
import type {TactFile} from "@server/languages/tact/psi/TactFile"
import {TypeInferer} from "@server/languages/tact/TypeInferer"
import {Reference} from "@server/languages/tact/psi/Reference"
import {Field, Fun, InitFunction, Message, MessageFunction} from "@server/languages/tact/psi/Decls"
import {
    AsmInstr,
    CallLike,
    Expression,
    NamedNode,
    TactNode,
    VarDeclaration,
} from "@server/languages/tact/psi/TactNode"
import {
    BaseTy,
    BouncedTy,
    ContractTy,
    MapTy,
    MessageTy,
    OptionTy,
    PrimitiveTy,
    sizeOfPresentation,
    Ty,
    unwrapBounced,
} from "@server/languages/tact/types/BaseTy"
import type {Node as SyntaxNode} from "web-tree-sitter"
import {computeSeqGasConsumption, instructionPresentation} from "@server/languages/tact/asm/gas"
import * as compiler from "@server/languages/tact/compiler/utils"
import {FileDiff} from "@server/utils/FileDiff"
import {InlayHintLabelPart, MarkupContent, MarkupKind} from "vscode-languageserver"
import {Location} from "vscode-languageclient"
import {asLspRange} from "@server/utils/position"
import {URI} from "vscode-uri"
import {evalAsciiBuiltin, evalCrc32Builtin} from "@server/languages/tact/compiler/utils"

function processParameterHints(
    shift: number,
    params: NamedNode[],
    args: SyntaxNode[],
    result: InlayHint[],
): void {
    if (params.length === 0) return

    if (params.length === 1 && params[0].file.fromStubs) {
        // don't add extra noise for unary functions from stubs
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

        if (argExpr.type === "instance_expression") {
            // no need to add a hint for `takeFoo(Foo{})`
            continue
        }

        if (argExpr.type === "static_call_expression") {
            const name = argExpr.childForFieldName("name")
            if (paramName === name?.text) {
                // no need to add a hint for `takeSender(sender())`
                continue
            }
        }

        if (argExpr.type === "method_call_expression") {
            const name = argExpr.childForFieldName("name")
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
                    location: toLocation(param.nameNode()),
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

function processToCellCall(call: CallLike, result: InlayHint[], showToCellSize: boolean): void {
    if (!showToCellSize) return
    if (call.node.type !== "method_call_expression" || call.name() !== "toCell") return

    const parent = call.node.parent

    // if:
    // Foo{}.asCell().bits()
    // Foo{}.asCell().bits
    if (parent?.type === "method_call_expression" || parent?.type === "field_access_expression") {
        return
    }

    const qualifier = call.node.childForFieldName("object")
    if (!qualifier) {
        return
    }

    const ty = TypeInferer.inferType(new Expression(qualifier, call.file))
    if (!ty) {
        return
    }

    if (ty instanceof ContractTy) return

    const sizeof = ty.sizeOf(new Map())
    if (!sizeof.valid) {
        return
    }

    result.push({
        kind: InlayHintKind.Parameter,
        label: " Size: " + sizeOfPresentation(sizeof),
        position: {
            line: call.node.endPosition.row,
            character: call.node.endPosition.column,
        },
        paddingLeft: true,
    })
}

function hasObviousType(expr: SyntaxNode): boolean {
    // don't show a hint for:
    // let params = SomeParams{}
    if (expr.type === "instance_expression") return true

    // don't show a hint for:
    // let foo = Foo.fromCell(cell)
    if (expr.type === "method_call_expression") {
        const name = expr.childForFieldName("name")
        if (name?.text === "fromCell") {
            return true
        }
    }

    return false
}

export async function collectTactInlays(
    file: TactFile,
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
        showContinuationGas: boolean
        showToCellSize: boolean
        showAsciiEvaluationResult: boolean
        showCrc32EvaluationResult: boolean
        showMessageId: boolean
        showReceiverOpcode: boolean
    },
    gasSettings: {
        loopGasCoefficient: number
    },
): Promise<InlayHint[] | null> {
    if (!hints.types && !hints.parameters) return []

    const result: InlayHint[] = []

    const gasHintTooltip: MarkupContent = {
        kind: "markdown",
        value: "Note that this value is approximate!\n\nLearn more about how LS calculates this: https://github.com/tact-lang/tact-language-server/blob/master/docs/manual/features/gas-calculation.md",
    }

    await AsyncRecursiveVisitor.visit(file.rootNode, async (n): Promise<boolean> => {
        const type = n.type

        if (type === "let_statement" && hints.types) {
            const decl = new VarDeclaration(n, file)
            if (decl.hasTypeHint()) return true // already have typehint

            const name = decl.nameIdentifier()
            if (!name) return true
            if (name.text === "_") return true

            const expr = decl.value()
            if (!expr) return true

            if (hasObviousType(expr.node)) return true

            const type = TypeInferer.inferType(expr)
            if (!type) return true

            const position = {
                line: name.endPosition.row,
                character: name.endPosition.column,
            }
            const hintText = `: ${type.qualifiedName()}`

            const diff = FileDiff.forFile(file.uri)
            diff.appendTo(position, hintText)

            result.push({
                kind: InlayHintKind.Type,
                label: typeHintParts(type),
                position: position,
                textEdits: diff.toTextEdits(),
            })
            return true
        }

        if (type === "destruct_bind" && hints.types) {
            const name = n.childForFieldName("name")
            if (!name) return true

            const field = Reference.findDestructField(n, file, name.text)
            if (!field) return true

            const fieldName = field.nameNode()
            if (!fieldName) return true
            const type = TypeInferer.inferType(fieldName)
            if (!type) return true

            // let Foo { name: otherName } = foo()
            //                 ^^^^^^^^^
            // or
            // let Foo { name } = foo()
            //           ^^^^
            const target = n.childForFieldName("bind") ?? n.childForFieldName("name")
            if (!target) return true

            result.push({
                kind: InlayHintKind.Type,
                label: typeHintParts(type),
                position: {
                    line: target.endPosition.row,
                    character: target.endPosition.column,
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
                const position = {
                    line: node.endPosition.row,
                    character: node.endPosition.column,
                }
                const hintText = ` as int257`

                const diff = FileDiff.forFile(file.uri)
                diff.appendTo(position, hintText)

                result.push({
                    kind: InlayHintKind.Type,
                    label: hintText,
                    position: position,
                    tooltip: {
                        kind: MarkupKind.Markdown,
                        value: "Default TL-B serialization type for Int type.\n\nLearn more in documentation: https://docs.tact-lang.org/book/integers/#common-serialization-types",
                    },
                    textEdits: diff.toTextEdits(),
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
                    label: typeHintParts(exprTy.keyTy),
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
                    label: typeHintParts(exprTy.valueTy),
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
                label: typeHintParts(exprTy),
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

            processToCellCall(call, result, hints.showToCellSize)

            const rawArgs = call.rawArguments()
            const args = rawArgs.filter(value => value.type === "argument")
            if (args.length === 0) return true // no arguments, no need to resolve anything

            const res = Reference.resolve(call.nameNode())
            if (!(res instanceof Fun)) return true

            const params = res.parameters()

            // We want to show the actual exit code for a message in require
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

            if (call.name() === "ascii" && hints.showAsciiEvaluationResult) {
                const arg = args[0]?.firstChild
                if (arg?.type === "string") {
                    const content = arg.text.slice(1, -1)
                    const realValue = evalAsciiBuiltin(content)

                    if (realValue === undefined) {
                        return true
                    }
                    evaluateResultHint(result, call, realValue)
                }
            }

            if (call.name() === "crc32" && hints.showCrc32EvaluationResult) {
                const arg = args[0]?.firstChild
                if (arg?.type === "string") {
                    const content = arg.text.slice(1, -1)
                    const realValue = evalCrc32Builtin(content)

                    evaluateResultHint(result, call, realValue)
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

        if (type === "asm_sequence" && hints.showContinuationGas) {
            const openBrace = n.firstChild
            const closeBrace = n.lastChild
            if (!openBrace || !closeBrace) return true
            if (openBrace.startPosition.row === closeBrace.startPosition.row) return true

            const gas = await computeSeqGasConsumption(n, file, gasSettings)

            result.push({
                kind: InlayHintKind.Type,
                label: instructionPresentation(gas.value.toString(), "", hints.gasFormat),
                position: {
                    line: openBrace.endPosition.row,
                    character: openBrace.endPosition.column,
                },
                tooltip: gasHintTooltip,
                paddingLeft: true,
            })
        }

        if (type === "asm_expression" && hints.showAsmInstructionGas) {
            const instr = new AsmInstr(n, file)
            const info = await instr.info()

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
            const closeBrace = func.closeBrace()
            if (!openBrace || !closeBrace) return true
            if (openBrace.startPosition.row === closeBrace.startPosition.row) return true

            const gas = await func.computeGasConsumption(gasSettings)
            if (gas.unknown || gas.value === 0) {
                console.log("here", gas)
                return true
            }

            const presentation = gas.exact ? `${gas.value} gas` : `~${gas.value} gas`

            result.push({
                kind: InlayHintKind.Type,
                label: `  ${presentation}`,
                position: {
                    line: openBrace.endPosition.row,
                    character: openBrace.endPosition.column,
                },
                tooltip: gasHintTooltip,
            })
            return true
        }

        if (type === "storage_function" && hints.showMethodId) {
            const func = new Fun(n, file)
            if (!func.isGetMethod) return true
            if (func.hasExplicitMethodId) return true

            const modifiers = n.childForFieldName("attributes")
            if (!modifiers) return true

            const actualId = func.computeMethodId()

            result.push({
                kind: InlayHintKind.Type,
                label: `(${actualId})`,
                position: {
                    line: modifiers.endPosition.row,
                    character: modifiers.endPosition.column,
                },
            })
            return true
        }

        if (type === "message" && n.text !== "message" && hints.showMessageId) {
            const message = new Message(n, file)
            if (message.explicitOpcode() !== undefined) {
                // message(0x1000) Foo {}
                //        ^^^^^^^^
                return true
            }

            const opcode = message.opcode()
            if (!opcode) {
                return true
            }

            // message(0x1000) Foo {}
            // ^^^^^^^
            const anchor = n.firstChild
            if (!anchor) return true

            const position = {
                line: anchor.endPosition.row,
                character: anchor.endPosition.column,
            }
            const hintText = `(${opcode})`

            const diff = FileDiff.forFile(file.uri)
            diff.appendTo(position, hintText)

            result.push({
                kind: InlayHintKind.Type,
                label: `(${opcode})`,
                position: position,
                textEdits: diff.toTextEdits(),
            })
        }

        if (
            (type === "receive_function" ||
                type === "bounced_function" ||
                type === "external_function") &&
            hints.showReceiverOpcode
        ) {
            const fun = new MessageFunction(n, file)
            const parameter = fun.parameter()
            const parameterType = parameter?.childForFieldName("type")
            if (!parameterType) return true

            const rawType = TypeInferer.inferType(new Expression(parameterType, file))
            if (!rawType) return true

            // bounced(msg: bounced<Bar>)
            //              ^^^^^^^^^^^^ unwrap to Bar
            const type = unwrapBounced(rawType)
            if (!(type instanceof MessageTy)) return true

            const message = type.anchor
            if (!message) return true

            const opcode = message.opcode()
            if (!opcode) return true

            // receive(msg: Foo)
            //                 ^ this
            const closeParen = n.child(3)
            if (!closeParen) return true

            result.push({
                kind: InlayHintKind.Type,
                label: ` opcode: ${opcode}`,
                position: {
                    line: closeParen.endPosition.row,
                    character: closeParen.endPosition.column,
                },
                tooltip: opcode,
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

function typeHintParts(ty: Ty): InlayHintLabelPart[] {
    return [
        {
            value: ": ",
        },
        ...renderTypeToParts(ty),
    ]
}

function renderTypeToParts(ty: Ty): InlayHintLabelPart[] {
    if (ty instanceof PrimitiveTy) {
        return [
            {
                value: ty.name(),
                tooltip: "",
                location: toLocation(ty.anchor?.nameNode()),
            },
        ]
    }

    if (ty instanceof OptionTy) {
        return [
            ...renderTypeToParts(ty.innerTy),
            {
                value: "?",
            },
        ]
    }

    if (ty instanceof BouncedTy) {
        return [{value: "bounced<"}, ...renderTypeToParts(ty.innerTy), {value: ">"}]
    }

    if (ty instanceof MapTy) {
        return [
            {value: "map<"},
            ...renderTypeToParts(ty.keyTy),
            {value: ", "},
            ...renderTypeToParts(ty.valueTy),
            {value: ">"},
        ]
    }

    if (ty instanceof BaseTy) {
        return [
            {
                value: ty.name(),
                location: toLocation((ty.anchor as NamedNode | undefined)?.nameNode()),
                tooltip: "",
            },
        ]
    }

    return [
        {
            value: ty.name(),
            tooltip: "",
        },
    ]
}

function toLocation(node: TactNode | null | undefined): Location | undefined {
    if (!node) return undefined

    return {
        uri: URI.parse(node.file.uri).toString(true),
        range: asLspRange(node.node),
    }
}

function evaluateResultHint(result: InlayHint[], anchor: CallLike, value: bigint): void {
    result.push({
        kind: InlayHintKind.Parameter,
        label: ` Evaluates to: 0x${value.toString(16)}`,
        position: {
            line: anchor.node.endPosition.row,
            character: anchor.node.endPosition.column,
        },
        tooltip: {
            kind: "markdown",
            value: `Evaluates to:\n - 0x${value.toString(16)}\n- ${value}`,
        },
    })
}
