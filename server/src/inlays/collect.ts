import {InlayHint, InlayHintKind} from "vscode-languageserver-types";
import {RecursiveVisitor} from "../visitor";
import {File} from "../psi/File";
import {TypeInferer} from "../TypeInferer";
import {Reference} from "../psi/Reference";
import {Function} from "../psi/TopLevelDeclarations";
import {CallLike, Expression, VarDeclaration} from "../psi/Node";
import {MapTy} from "../types/BaseTy";

export function collect(file: File): InlayHint[] | null {
    const result: InlayHint[] = []

    RecursiveVisitor.visit(file.rootNode, (n): boolean => {
        if (n.type === 'let_statement') {
            const decl = new VarDeclaration(n, file)
            if (decl.typeHint() !== null) return true // already have typehint

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
                }
            })
        }

        if (n.type === 'foreach_statement') {
            const expr = n.childForFieldName('map')
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
                    }
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
                    }
                })
            }
        }

        if (n.type === 'static_call_expression' || n.type === 'method_call_expression') {
            const call = new CallLike(n, file)
            const res = Reference.resolve(call.nameNode())
            if (!(res instanceof Function)) return true

            const params = res.parameters()
            const rawArgs = call.rawArguments();
            const args = rawArgs.filter(value => value.type === 'argument')

            // skip self parameter
            const shift = n.type === 'method_call_expression' ? 1 : 0

            for (let i = 0; i < min(params.length - shift, args.length); i++) {
                const param = params[i + shift]
                const arg = args[i]

                result.push({
                    kind: InlayHintKind.Parameter,
                    label: `${param.name()}:`,
                    position: {
                        line: arg.startPosition.row,
                        character: arg.startPosition.column,
                    }
                })
            }
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
