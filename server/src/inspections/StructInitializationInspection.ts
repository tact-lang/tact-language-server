import * as lsp from "vscode-languageserver"
import type {File} from "@server/psi/File"
import {asLspRange} from "@server/utils/position"
import {RecursiveVisitor} from "@server/psi/RecursiveVisitor"
import type {Node as SyntaxNode} from "web-tree-sitter"
import {Inspection, InspectionIds} from "./Inspection"
import {Reference} from "@server/psi/Reference"
import {NamedNode} from "@server/psi/Node"
import {FieldsOwner} from "@server/psi/Decls"

export class StructInitializationInspection implements Inspection {
    public readonly id: "struct-initialization" = InspectionIds.STRUCT_INITIALIZATION

    public inspect(file: File): lsp.Diagnostic[] {
        if (file.fromStdlib) return []
        const diagnostics: lsp.Diagnostic[] = []

        RecursiveVisitor.visit(file.rootNode, node => {
            if (node.type === "instance_expression") {
                this.checkStructLiteral(node, file, diagnostics)
            }
        })

        return diagnostics
    }

    private checkStructLiteral(node: SyntaxNode, file: File, diagnostics: lsp.Diagnostic[]): void {
        const structName = node.childForFieldName("name")
        if (!structName) return
        const args = node.childForFieldName("arguments")
        if (!args) return

        const structDef = Reference.resolve(new NamedNode(structName, file))
        if (!structDef) return
        if (!(structDef instanceof FieldsOwner)) return

        const fields = structDef.fields()
        const requiredFields = fields.filter(f => f.defaultValue() === null).map(f => f.name())

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
}
