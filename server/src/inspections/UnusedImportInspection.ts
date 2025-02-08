import * as lsp from "vscode-languageserver"
import {File} from "@server/psi/File"
import {asLspRange} from "@server/utils/position"
import {Node as SyntaxNode} from "web-tree-sitter"
import {ImportResolver} from "@server/psi/ImportResolver"
import {Inspection, InspectionIds} from "./Inspection"

export class UnusedImportInspection implements Inspection {
    readonly id: "unused-import" = InspectionIds.UNUSED_IMPORT

    inspect(file: File): lsp.Diagnostic[] {
        if (file.fromStdlib) return []
        const diagnostics: lsp.Diagnostic[] = []

        const imports: Map<
            string,
            {
                node: SyntaxNode
                names: Set<string>
            }
        > = new Map()

        const importNodes = file.rootNode.children
            .filter(it => it?.type === "import")
            .filter(it => it !== null)

        importNodes.forEach(imp => {
            const pathNode = imp.childForFieldName("library")
            if (!pathNode) return

            const importPath = pathNode.text.slice(1, -1)
            const importedFile = ImportResolver.resolveNode(file, pathNode)
            if (!importedFile) return

            const decls = importedFile.getDecls()

            const names: Set<string> = new Set()
            decls.forEach(d => {
                names.add(d.name())
            })

            imports.set(importPath, {
                node: imp,
                names,
            })
        })

        for (const [importPath, {node, names}] of imports) {
            if (!this.usedInFile(names, file)) {
                diagnostics.push({
                    severity: lsp.DiagnosticSeverity.Hint,
                    range: asLspRange(node),
                    message: `Import '${importPath}' is never used`,
                    source: "tact",
                    code: "unused-import",
                    tags: [lsp.DiagnosticTag.Unnecessary],
                })
            }
        }

        return diagnostics
    }

    private usedInFile(names: Set<string>, file: File): boolean {
        for (const name of names) {
            if (file.content.includes(name)) {
                return true
            }
        }
        return false
    }
}
