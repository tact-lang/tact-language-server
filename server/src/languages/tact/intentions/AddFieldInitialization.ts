//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type {Intention, IntentionContext} from "@server/languages/tact/intentions/Intention"
import type {WorkspaceEdit} from "vscode-languageserver"
import type {File} from "@server/languages/tact/psi/File"
import {asLspPosition, asParserPoint} from "@server/utils/position"
import type {Position} from "vscode-languageclient"
import {FileDiff} from "@server/utils/FileDiff"
import {Field, InitFunction, StorageMembersOwner} from "@server/languages/tact/psi/Decls"
import {PrimitiveTy, StructTy, Ty} from "@server/languages/tact/types/BaseTy"
import {RecursiveVisitor} from "@server/languages/tact/psi/RecursiveVisitor"
import type {Node as SyntaxNode} from "web-tree-sitter"
import {TypeInferer} from "@server/TypeInferer"
import {NamedNode} from "@server/languages/tact/psi/Node"

export class AddFieldInitialization implements Intention {
    public readonly id: string = "tact.add-field-to-init"
    public readonly name: string = "Initialize field in init()"

    private resolveField(ctx: IntentionContext): Field | null {
        const node = nodeAtPosition(ctx.position, ctx.file)
        if (node?.type !== "identifier") return null

        const field = node.parent
        if (field?.type !== "storage_variable") return null

        return new Field(field, ctx.file)
    }

    public isAvailable(ctx: IntentionContext): boolean {
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

    public invoke(ctx: IntentionContext): WorkspaceEdit | null {
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
            // most simple case, mo init function, so we need to add one
            return this.appendInitFunction(diff, field, type, owner)
        }

        const parameters = initFunction.parameters()
        if (parameters.length === 1 && parameters[0].name() === "init") {
            // add new field to `*Init` struct
            return this.addInitializationViaField(diff, initFunction, parameters[0], field, type)
        }

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
        this.addFieldInit(diff, initFunction, field, field.name())
        return diff.toWorkspaceEdit()
    }

    private addFieldInit(
        diff: FileDiff,
        initFunction: InitFunction,
        field: Field,
        initializer: string,
    ): void {
        // init(foo: Int) {
        //     if (true) { ... }
        //     self.foo = foo;
        //     ^^^^^^^^^^^^^^^ this
        // }
        const lastStatementPos = initFunction.lastStatementPos()
        if (!lastStatementPos) return

        // contract Foo {
        //     foo: Int;
        //
        //     init(foo: Int) {
        //         self.foo = foo;
        //^^^^^^^^^ this
        //     }
        // }
        const indent = " ".repeat(8)
        const fieldInit = `${indent}self.${field.name()} = ${initializer};`

        if (initFunction.hasOneLineBody) {
            const closeBraceIndent = " ".repeat(4)
            diff.appendTo(lastStatementPos, `\n${fieldInit}\n${closeBraceIndent}`)
        } else {
            diff.appendAsNextLine(lastStatementPos.line, fieldInit)
        }
    }

    private addInitializationViaField(
        diff: FileDiff,
        initFunction: InitFunction,
        parameter: NamedNode,
        field: Field,
        type: Ty,
    ): WorkspaceEdit | null {
        const parameterType = TypeInferer.inferType(parameter)
        if (!(parameterType instanceof StructTy)) return null

        const initStruct = parameterType.anchor
        if (!initStruct) return null

        const placeToInsert = initStruct.lastFieldPos()
        if (!placeToInsert) return null

        diff.appendAsNextLine(placeToInsert.line, `    ${field.name()}: ${type.qualifiedName()};`)

        // add `self.value = init.value`
        this.addFieldInit(diff, initFunction, field, `init.${field.name()}`)
        return diff.toWorkspaceEdit()
    }

    private appendInitFunction(
        diff: FileDiff,
        resolved: Field,
        type: Ty,
        owner: StorageMembersOwner,
    ): WorkspaceEdit {
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
        const lineToAdd = Math.max(...lines)

        if (!this.fieldCanBeParameter(resolved)) {
            // need to create `*Init` structure
            const initStrucName = `${owner.name()}Init`

            const initStructTemplate = `struct ${initStrucName} {
    ${resolved.name()}: ${type.qualifiedName()};
}
`

            const initFunctionTemplate = `
    init(init: ${initStrucName}) {
        self.$name = init.$name;
    }`

            const actualText = initFunctionTemplate
                .replace(/\$name/g, resolved.name())
                .replace(/\$type/g, type.qualifiedName())

            diff.appendAsNextLine(lineToAdd, actualText)
            diff.appendAsPrevLine(owner.node.startPosition.row, initStructTemplate)
            return diff.toWorkspaceEdit()
        }

        const initFunctionTemplate = `
    init($name: $type) {
        self.$name = $name;
    }`
        const actualText = initFunctionTemplate
            .replace(/\$name/g, resolved.name())
            .replace(/\$type/g, type.qualifiedName())

        diff.appendAsNextLine(lineToAdd, actualText)
        return diff.toWorkspaceEdit()
    }

    private fieldCanBeParameter(field: Field): boolean {
        const name = field.nameNode()
        if (!name) return true
        const ty = TypeInferer.inferType(name)
        if (!ty) return true
        if (ty instanceof PrimitiveTy && ty.tlb !== null) {
            // cannot define parameter with `Int as uint8` type
            return false
        }
        // any other can be defined as parameter
        return true
    }
}

function nodeAtPosition(pos: Position, file: File): SyntaxNode | null {
    const cursorPosition = asParserPoint(pos)
    return file.rootNode.descendantForPosition(cursorPosition)
}
