//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import * as lsp from "vscode-languageserver"
import type {TactFile} from "@server/languages/tact/psi/TactFile"
import {asLspRange} from "@server/utils/position"
import {RecursiveVisitor} from "@server/languages/tact/psi/RecursiveVisitor"
import type {Node as SyntaxNode} from "web-tree-sitter"
import {Inspection, InspectionIds} from "./Inspection"
import {Reference} from "@server/languages/tact/psi/Reference"
import {NamedNode} from "@server/languages/tact/psi/TactNode"
import {Field, FieldsOwner} from "@server/languages/tact/psi/Decls"
import {OptionTy} from "@server/languages/tact/types/BaseTy"

export class StructInitializationInspection implements Inspection {
    public readonly id: "struct-initialization" = InspectionIds.STRUCT_INITIALIZATION

    public inspect(file: TactFile): lsp.Diagnostic[] {
        if (file.fromStdlib) return []
        const diagnostics: lsp.Diagnostic[] = []

        RecursiveVisitor.visit(file.rootNode, node => {
            if (node.type === "instance_expression") {
                this.checkStructLiteral(node, file, diagnostics)
            }
        })

        return diagnostics
    }

    private checkStructLiteral(
        node: SyntaxNode,
        file: TactFile,
        diagnostics: lsp.Diagnostic[],
    ): void {
        const structName = node.childForFieldName("name")
        if (!structName) return
        const args = node.childForFieldName("arguments")
        if (!args) return

        const structDef = Reference.resolve(new NamedNode(structName, file))
        if (!structDef) return
        if (!(structDef instanceof FieldsOwner)) return

        const fields = structDef.fields()
        const requiredFields = fields.filter(f => !this.canBeOmitted(f)).map(f => f.name())

        const initializedFields: Set<string> = new Set()
        args.children.forEach(child => {
            if (!child) return
            if (child.type !== "instance_argument") return
            const name = child.childForFieldName("name")
            if (!name) return

            // Foo { name }
            //       ^^^^
            // or
            // Foo { name: value }
            //       ^^^^
            initializedFields.add(name.text)
        })

        const missingFields = requiredFields.filter(field => !initializedFields.has(field))

        const message =
            missingFields.length === 1
                ? `Field '${missingFields[0]}' is required but not initialized`
                : `Fields ${missingFields.map(f => `'${f}'`).join(", ")} are required but not initialized`

        if (missingFields.length > 0) {
            diagnostics.push({
                severity: lsp.DiagnosticSeverity.Error,
                range: asLspRange(structName),
                message: message,
                source: "tact",
                code: "missing-fields",
            })
        }
    }

    private canBeOmitted(f: Field): boolean {
        if (f.defaultValue() !== null) {
            return true
        }

        const type = f.typeNode()?.type()
        return type instanceof OptionTy
    }
}
