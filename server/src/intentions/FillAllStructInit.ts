import type {Intention, IntentionContext} from "@server/intentions/Intention"
import type {WorkspaceEdit} from "vscode-languageserver"
import type {File} from "@server/psi/File"
import {asLspPosition, asParserPoint} from "@server/utils/position"
import type {Position} from "vscode-languageclient"
import {FileDiff} from "@server/utils/FileDiff"
import {parentOfType} from "@server/psi/utils"
import type {Node as SyntaxNode} from "web-tree-sitter"
import {NamedNode} from "@server/psi/Node"
import {TypeInferer} from "@server/TypeInferer"
import {
    FieldsOwnerTy,
    MapTy,
    MessageTy,
    NullTy,
    OptionTy,
    PrimitiveTy,
    StructTy,
} from "@server/types/BaseTy"
import type {Field} from "@server/psi/Decls"

export class FillStructInitBase implements Intention {
    public readonly id: string = "tact.fill-struct-init-base"
    public readonly name: string = "Fill all fields..."

    public constructor(private readonly allFields: boolean) {}

    private static findInstanceExpression(ctx: IntentionContext): SyntaxNode | null {
        const referenceNode = nodeAtPosition(ctx.position, ctx.file)
        if (!referenceNode) return null
        const initExpr = parentOfType(referenceNode, "instance_expression")
        if (!initExpr) return null
        return initExpr
    }

    public isAvailable(ctx: IntentionContext): boolean {
        const instance = FillStructInitBase.findInstanceExpression(ctx)
        if (!instance) return false
        const argumentsNode = instance.childForFieldName("arguments")
        if (!argumentsNode) return false
        const args = argumentsNode.children
            .filter(it => it?.type === "instance_argument")
            .filter(it => it !== null)
        return args.length === 0
    }

    private static findBraces(instance: SyntaxNode): {
        openBrace: SyntaxNode
        closeBrace: SyntaxNode
    } | null {
        const args = instance.childForFieldName("arguments")
        if (!args) return null

        const openBrace = args.children[0]
        const closeBrace = args.children.at(-1)
        if (!openBrace || !closeBrace) return null
        return {openBrace, closeBrace}
    }

    private static findIndent(ctx: IntentionContext, instance: SyntaxNode): number {
        const lines = ctx.file.content.split(/\r?\n/)
        const line = lines[instance.startPosition.row]
        const lineTrim = line.trimStart()
        return line.indexOf(lineTrim)
    }

    public invoke(ctx: IntentionContext): WorkspaceEdit | null {
        const instance = FillStructInitBase.findInstanceExpression(ctx)
        if (!instance) return null

        //    let some = Foo{}
        //               ^^^ this
        const name = instance.childForFieldName("name")
        if (!name) return null

        const type = TypeInferer.inferType(new NamedNode(name, ctx.file))
        if (!type) return null
        if (!(type instanceof FieldsOwnerTy)) return null

        const braces = FillStructInitBase.findBraces(instance)
        if (!braces) return null

        //    let some = Foo{}
        //                  ^^ these
        const {openBrace, closeBrace} = braces

        //    let some = Foo{}
        //^^^^ this
        const indent = FillStructInitBase.findIndent(ctx, instance)

        //    let some = Foo{
        //        field: 1,
        //^^^^^^^^ this
        const fieldIndent = " ".repeat(indent + 4)

        //    let some = Foo{
        //        field: 1,
        //    }
        //^^^^ this
        const closeBraceIndent = " ".repeat(indent)

        const fields = type.fields().filter(field => {
            // if `allFields` is false, filter all fields with default value
            return this.allFields || field.defaultValue() === null
        })

        if (fields.length === 0) return null // no fields to init

        //       field: false,
        //       other: null,
        const fieldsPresentation = fields
            .map(field => {
                const name = field.name()
                const value = FillStructInitBase.fieldDefaultValue(field)
                return `${fieldIndent}${name}: ${value},`
            })
            .join("\n")

        //    let some = Foo{}
        //                  ^^
        const singleLine = openBrace.startPosition.row === closeBrace.endPosition.row

        //    let some = Foo{
        //    }
        //    ^ don't add extra new line here
        const newLine = singleLine ? "\n" : ""

        const diff = FileDiff.forFile(ctx.file.uri)
        diff.appendTo(
            asLspPosition(openBrace.endPosition),
            `\n${fieldsPresentation}${newLine}${closeBraceIndent}`,
        )

        return diff.toWorkspaceEdit()
    }

    private static fieldDefaultValue(field: Field): string {
        const defaultValue = field.defaultValue()
        if (defaultValue) return defaultValue.node.text

        const type = field.typeNode()?.type()
        if (!type) return "null"

        if (type instanceof MapTy) {
            return "emptyMap()"
        }

        if (type instanceof OptionTy || type instanceof NullTy) {
            return "null"
        }

        if (type instanceof PrimitiveTy) {
            switch (type.name()) {
                case "Int": {
                    return "0"
                }
                case "Bool": {
                    return "false"
                }
                case "Address": {
                    return "sender()"
                }
                case "Cell": {
                    return "emptyCell()"
                }
                case "Builder": {
                    return "beginCell()"
                }
                case "Slice": {
                    return "emptySlice()"
                }
                case "String": {
                    return `""`
                }
                case "StringBuilder": {
                    return `beginString()`
                }
            }
        }

        if (type instanceof StructTy || type instanceof MessageTy) {
            return `${type.name()}{}`
        }

        return "null"
    }
}

export class FillAllStructInit extends FillStructInitBase {
    public override readonly id: string = "tact.fill-struct-init"
    public override readonly name: string = "Fill all fields..."

    public constructor() {
        super(true)
    }
}

export class FillRequiredStructInit extends FillStructInitBase {
    public override readonly id: string = "tact.fill-required-struct-init"
    public override readonly name: string = "Fill required fields..."

    public constructor() {
        super(false)
    }
}

function nodeAtPosition(pos: Position, file: File): SyntaxNode | null {
    const cursorPosition = asParserPoint(pos)
    return file.rootNode.descendantForPosition(cursorPosition)
}
