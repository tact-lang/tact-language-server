import {Intention, IntentionContext} from "@server/intentions/Intention"
import {WorkspaceEdit} from "vscode-languageserver"
import {File} from "@server/psi/File"
import {asLspPosition, asParserPoint} from "@server/utils/position"
import {Position} from "vscode-languageclient"
import {FileDiff} from "@server/utils/FileDiff"
import {Field, StorageMembersOwner} from "@server/psi/Decls"
import {Ty} from "@server/types/BaseTy"
import {RecursiveVisitor} from "@server/psi/RecursiveVisitor"

export class AddFieldInitialization implements Intention {
    id: string = "tact.add-field-to-init"
    name: string = "Initialize field in init()"

    resolveField(ctx: IntentionContext): Field | null {
        const node = nodeAtPosition(ctx.position, ctx.file)
        if (node?.type !== "identifier") return null

        const field = node.parent
        if (field?.type !== "storage_variable") return null

        return new Field(field, ctx.file)
    }

    is_available(ctx: IntentionContext): boolean {
        const resolved = this.resolveField(ctx)
        if (!resolved) return false
        const owner = resolved.owner()
        if (!owner) return false
        const initFunction = owner.initFunction()
        if (initFunction === null) return true // no init function so no initialization

        const fieldAccess = `self.${resolved.name()}`

        // walk over init function to find if there are any initializations of field already
        let initialized = false
        RecursiveVisitor.visit(initFunction.node, node => {
            if (node.type === "assignment_statement") {
                const left = node.childForFieldName("left")
                if (left?.type !== "field_access_expression") return

                if (left.text === fieldAccess) {
                    initialized = true
                }
            }
        })

        return !initialized
    }

    invoke(ctx: IntentionContext): WorkspaceEdit | null {
        const field = this.resolveField(ctx)
        if (!field) return null
        const type = field.typeNode()?.type()
        if (!type) return null

        const owner = field.owner()
        if (!owner) return null

        const diff = FileDiff.forFile(ctx.file.uri)

        // remove explicit default value
        // contract Foo {
        //     foo: Int = 0;
        //             ^^^^ this
        // }
        const defaultValueRange = field.defaultValueRange()
        if (defaultValueRange) {
            diff.replace(defaultValueRange, "")
        }

        const initFunction = owner.initFunction()
        if (!initFunction) {
            // most simple case, mo init function so we need to add one
            return this.appendInitFunction(diff, field, type, owner)
        }

        const parameters = initFunction.parameters()
        const placeToAddParameter = initFunction.endParen()
        if (!placeToAddParameter) return null

        const hasParameter = parameters.some(p => p.name() === field.name())
        if (!hasParameter) {
            // for `init()` we don't want to add comma at beginning
            const commaPart = parameters.length === 0 ? "" : ", "

            const parameter = `${field.name()}: ${type.qualifiedName()}`
            diff.appendTo(
                asLspPosition(placeToAddParameter.startPosition),
                `${commaPart}${parameter}`,
            )
        }

        // init(foo: Int) {
        //     if (true) { ... }
        //     self.foo = foo;
        //     ^^^^^^^^^^^^^^^ this
        // }
        const lastStatementPos = initFunction.lastStatementPos()
        if (!lastStatementPos) return null

        // contract Foo {
        //     foo: Int;
        //
        //     init(foo: Int) {
        //         self.foo = foo;
        //^^^^^^^^^ this
        //     }
        // }
        const indent = " ".repeat(8)
        const fieldInit = `${indent}self.${field.name()} = ${field.name()};`

        if (initFunction.hasOneLineBody) {
            const closeBraceIndent = " ".repeat(4)
            diff.appendTo(lastStatementPos, `\n${fieldInit}\n${closeBraceIndent}`)
            return diff.toWorkspaceEdit()
        }

        diff.appendAsNextLine(lastStatementPos.line, fieldInit)
        return diff.toWorkspaceEdit()
    }

    private appendInitFunction(
        diff: FileDiff,
        resolved: Field,
        type: Ty,
        owner: StorageMembersOwner,
    ) {
        const initFunctionTemplate = `
    init($name: $type) {
        self.$name = $name;
    }`
        const actualText = initFunctionTemplate
            .replace(/\$name/g, resolved.name())
            .replace(/\$type/g, type.qualifiedName())

        const lines = [
            owner.node.startPosition.row + 1, // next line after name
            ...owner.ownFields().map(f => f.node.endPosition.row),
            ...owner.ownConstants().map(f => f.node.endPosition.row),
        ]

        // imagine we have:
        // contract Foo {
        //     field: Int;
        // }
        //
        // line to add here will be line of `field: Int;` as we add new content after line
        //
        // for:
        // contract Foo {
        //     field: Int;
        //
        //     const FOO: Int = 10;
        // }
        //
        // line to add here will be line of `const FOO: Int = 10;`
        const lineToAdd = lines.reduce((prev, cur) => (cur > prev ? cur : prev), 0)

        diff.appendAsNextLine(lineToAdd, actualText)
        return diff.toWorkspaceEdit()
    }
}

function nodeAtPosition(pos: Position, file: File) {
    const cursorPosition = asParserPoint(pos)
    return file.rootNode.descendantForPosition(cursorPosition)
}
