//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import * as lsp from "vscode-languageserver"
import type {File} from "@server/languages/tact/psi/File"
import {asLspRange} from "@server/utils/position"
import type {Node as SyntaxNode} from "web-tree-sitter"
import {ImportResolver} from "@server/languages/tact/psi/ImportResolver"
import {Inspection, InspectionIds} from "./Inspection"

export class UnusedImportInspection implements Inspection {
    public readonly id: "unused-import" = InspectionIds.UNUSED_IMPORT

    public inspect(file: File): lsp.Diagnostic[] {
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
            const importedFile = ImportResolver.resolveAsFile(file, pathNode)
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
            if (!UnusedImportInspection.usedInFile(names, file)) {
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

    private static usedInFile(names: Set<string>, file: File): boolean {
        const lines = file.content.split(/\r?\n/)

        for (const line of lines) {
            for (const name of names) {
                if (line.includes("//")) {
                    // handle a case like this:
                    // ```
                    // contract Foo with Ownable { // comment about Ownable
                    // ```
                    const beforeComment = line.slice(0, line.indexOf("//"))
                    if (beforeComment.includes(name)) {
                        return true
                    }
                    continue
                }

                if (line.includes(name)) {
                    return true
                }
            }
        }
        return false
    }
}
