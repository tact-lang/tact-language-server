import {InlayHint, InlayHintKind} from "vscode-languageserver-types"
import {RecursiveVisitor} from "@server/psi/visitor"
import {File} from "@server/psi/File"
import {TypeInferer} from "@server/TypeInferer"
import {Reference} from "@server/psi/Reference"
import {Field, Fun} from "@server/psi/Decls"
import {CallLike, Expression, VarDeclaration} from "@server/psi/Node"
import {MapTy} from "@server/types/BaseTy"
import {findInstruction} from "@server/completion/data/types"
import {createHash} from "node:crypto"

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

        if (type === "field" || type === "storage_variable") {
            const field = new Field(n, file)
            const typeNode = field.typeNode()
            if (!typeNode) return true
            const type = typeNode.type()

            if (
                type?.name() === "Int" &&
                field.tlbType() === null &&
                hints.showExplicitTLBIntType
            ) {
                result.push({
                    kind: InlayHintKind.Type,
                    label: ` as int257`,
                    position: {
                        line: typeNode.node.endPosition.row,
                        character: typeNode.node.endPosition.column,
                    },
                })
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
            if (args.length === 0) return true // no parameters, no need to resolve anything

            const res = Reference.resolve(call.nameNode())
            if (!(res instanceof Fun)) return true

            const params = res.parameters()

            // We want to show the actual exit code for message in require
            // require(true, "message")
            // =>
            // require(true, "message" exit code: 999)
            if (call.name() === "require") {
                const message = args.at(-1)
                if (message && args.length > 1) {
                    const content = message.text.slice(1, -1)
                    const buff = createHash("sha256").update(content).digest()
                    const code = (buff.readUInt32BE(0) % 63_000) + 1000

                    const codeStr =
                        hints.exitCodeFormat === "hex"
                            ? `0x${code.toString(16).toUpperCase()}`
                            : code.toString()

                    result.push({
                        kind: InlayHintKind.Parameter,
                        label: ` exit code: ${codeStr}`,
                        position: {
                            line: message.endPosition.row,
                            character: message.endPosition.column,
                        },
                    })
                }
            }

            // skip self parameter
            const shift = type === "method_call_expression" && res.withSelf() ? 1 : 0

            for (let i = 0; i < Math.min(params.length - shift, args.length); i++) {
                const param = params[i + shift]
                const arg = args[i]
                const paramName = param.name()

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
            return true
        }

        if (type === "tvm_ordinary_word" && hints.showAsmInstructionGas) {
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
