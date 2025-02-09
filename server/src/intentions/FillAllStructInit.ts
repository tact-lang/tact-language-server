import {Intention, IntentionContext} from "@server/intentions/Intention"
import {WorkspaceEdit} from "vscode-languageserver"
import {File} from "@server/psi/File"
import {asLspPosition, asParserPoint} from "@server/utils/position"
import {Position} from "vscode-languageclient"
import {FileDiff} from "@server/utils/FileDiff"
import {parentOfType} from "@server/psi/utils"
import {Node as SyntaxNode} from "web-tree-sitter"
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
import {Field} from "@server/psi/Decls"

export class FillStructInitBase implements Intention {
    id: string = "tact.fill-struct-init-base"
    name: string = "Fill all fields..."

    constructor(private readonly allFields: boolean) {}

    private findInstanceExpression(ctx: IntentionContext): SyntaxNode | null {
        const referenceNode = nodeAtPosition(ctx.position, ctx.file)
        if (!referenceNode) return null
        const initExpr = parentOfType(referenceNode, "instance_expression")
        if (!initExpr) return null
        return initExpr
    }

    is_available(ctx: IntentionContext): boolean {
        const instance = this.findInstanceExpression(ctx)
        if (!instance) return false
        const argumentsNode = instance.childForFieldName("arguments")
        if (!argumentsNode) return false
        const args = argumentsNode.children
            .filter(it => it?.type === "instance_argument")
            .filter(it => it !== null)
        return args.length === 0
    }

    private findBraces(instance: SyntaxNode) {
        const args = instance.childForFieldName("arguments")
        if (!args) return null

        const openBrace = args.children[0]
        const closeBrace = args.children.at(-1)
        if (!openBrace || !closeBrace) return null
        return {openBrace, closeBrace}
    }

    private findIndent(ctx: IntentionContext, instance: SyntaxNode) {
        const lines = ctx.file.content.split(/\r?\n/)
        const line = lines[instance.startPosition.row]
        const lineTrim = line.trimStart()
        return line.indexOf(lineTrim)
    }

    invoke(ctx: IntentionContext): WorkspaceEdit | null {
        const instance = this.findInstanceExpression(ctx)
        if (!instance) return null

        //    let some = Foo{}
        //               ^^^ this
        const name = instance.childForFieldName("name")
        if (!name) return null

        const type = TypeInferer.inferType(new NamedNode(name, ctx.file))
        if (!type) return null
        if (!(type instanceof FieldsOwnerTy)) return null

        const braces = this.findBraces(instance)
        if (!braces) return null

        //    let some = Foo{}
        //                  ^^ these
        const {openBrace, closeBrace} = braces

        //    let some = Foo{}
        //^^^^ this
        const indent = this.findIndent(ctx, instance)

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
                const value = this.fieldDefaultValue(field)
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

    private fieldDefaultValue(field: Field): string | null {
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
                case "Int":
                    return "0"
                case "Bool":
                    return "false"
                case "Address":
                    return "sender()"
                case "Cell":
                    return "emptyCell()"
                case "Builder":
                    return "beginCell()"
                case "Slice":
                    return "emptySlice()"
                case "String":
                    return `""`
                case "StringBuilder":
                    return `beginString()`
            }
        }

        if (type instanceof StructTy || type instanceof MessageTy) {
            return `${type.name()}{}`
        }

        return "null"
    }
}

export class FillAllStructInit extends FillStructInitBase {
    override id: string = "tact.fill-struct-init"
    override name: string = "Fill all fields..."

    constructor() {
        super(true)
    }
}

export class FillRequiredStructInit extends FillStructInitBase {
    override id: string = "tact.fill-required-struct-init"
    override name: string = "Fill required fields..."

    constructor() {
        super(false)
    }
}

function nodeAtPosition(pos: Position, file: File) {
    const cursorPosition = asParserPoint(pos)
    return file.rootNode.descendantForPosition(cursorPosition)
}
