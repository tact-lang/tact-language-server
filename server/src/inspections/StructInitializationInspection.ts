import * as lsp from "vscode-languageserver"
import {File} from "@server/psi/File"
import {asLspRange} from "@server/utils/position"
import {RecursiveVisitor} from "@server/psi/RecursiveVisitor"
import {Node as SyntaxNode} from "web-tree-sitter"
import {index, IndexKey} from "@server/indexes"
import {Inspection, InspectionIds} from "./Inspection"

export class StructInitializationInspection implements Inspection {
    readonly id: "struct-initialization" = InspectionIds.STRUCT_INITIALIZATION

    inspect(file: File): lsp.Diagnostic[] {
        if (file.fromStdlib) return []
        const diagnostics: lsp.Diagnostic[] = []

        RecursiveVisitor.visit(file.rootNode, node => {
            if (node.type === "instance_expression") {
                this.checkStructLiteral(node, diagnostics)
            }
        })

        return diagnostics
    }

    private checkStructLiteral(node: SyntaxNode, diagnostics: lsp.Diagnostic[]) {
        const structName = node.childForFieldName("name")
        if (!structName) return
        const args = node.childForFieldName("arguments")
        if (!args) return

        const structDef =
            index.elementByName(IndexKey.Structs, structName.text) ??
            index.elementByName(IndexKey.Messages, structName.text)
        if (!structDef) return

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
