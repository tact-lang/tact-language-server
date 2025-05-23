import * as lsp from "vscode-languageserver"
import type {File} from "@server/psi/File"
import {asLspRange} from "@server/utils/position"
import {RecursiveVisitor} from "@server/psi/RecursiveVisitor"
import {Reference} from "@server/psi/Reference"
import {NamedNode} from "@server/psi/Node"
import {Contract, Field, Primitive} from "@server/psi/Decls"
import {Inspection, InspectionIds} from "./Inspection"
import {index} from "@server/indexes"

export class NotImportedSymbolInspection implements Inspection {
    public readonly id: "not-imported-symbol" = InspectionIds.NOT_IMPORTED_SYMBOL

    public inspect(file: File): lsp.Diagnostic[] {
        if (file.fromStdlib) return []
        const diagnostics: lsp.Diagnostic[] = []

        RecursiveVisitor.visit(file.rootNode, node => {
            if (node.type !== "identifier" && node.type !== "type_identifier") return

            if (node.type === "identifier") {
                const parentType = node.parent?.type
                if (parentType !== "static_call_expression") {
                    // check only call of global functions
                    return
                }
            }

            const resolved = Reference.resolve(new NamedNode(node, file))
            if (!resolved) return
            if (
                resolved instanceof Primitive ||
                resolved instanceof Contract ||
                resolved instanceof Field
            ) {
                return
            }

            // don't need to import same file
            if (resolved.file.uri === file.uri) return

            const importPath = resolved.file.importPath(file)
            // already imported
            if (file.alreadyImport(importPath)) return
            // some files like stubs or stdlib imported implicitly
            if (resolved.file.isImportedImplicitly()) return
            // guard for multi projects
            if (index.hasSeveralDeclarations(resolved.name())) return

            diagnostics.push({
                severity: lsp.DiagnosticSeverity.Warning,
                range: asLspRange(node),
                message: "Symbol from another file should be imported explicitly",
                source: "tact",
                code: "not-imported-symbol",
            })
        })

        return diagnostics
    }
}
