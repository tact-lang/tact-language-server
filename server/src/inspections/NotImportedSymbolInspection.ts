import * as lsp from "vscode-languageserver"
import {File} from "@server/psi/File"
import {asLspRange} from "@server/utils/position"
import {RecursiveVisitor} from "@server/psi/RecursiveVisitor"
import {Reference} from "@server/psi/Reference"
import {NamedNode} from "@server/psi/Node"
import {Contract, Primitive} from "@server/psi/Decls"
import {Inspection, InspectionIds} from "./Inspection"

export class NotImportedSymbolInspection implements Inspection {
    readonly id: "not-imported-symbol" = InspectionIds.NOT_IMPORTED_SYMBOL

    inspect(file: File): lsp.Diagnostic[] {
        if (file.fromStdlib) return []
        const diagnostics: lsp.Diagnostic[] = []

        RecursiveVisitor.visit(file.rootNode, node => {
            if (node.type !== "identifier" && node.type !== "type_identifier") return
            const resolved = Reference.resolve(new NamedNode(node, file))
            if (!resolved) return
            if (resolved instanceof Primitive || resolved instanceof Contract) return

            // don't need to import same file
            if (resolved.file.uri === file.uri) return

            const importPath = resolved.file.importPath(file)
            // already imported
            if (file.alreadyImport(importPath)) return
            // some files like stubs or stdlib imported implicitly
            if (resolved.file.isImportedImplicitly()) return

            diagnostics.push({
                severity: lsp.DiagnosticSeverity.Error,
                range: asLspRange(node),
                message: "Symbol from another file should be imported",
                source: "tact",
                code: "not-imported-symbol",
            })
        })

        return diagnostics
    }
}
