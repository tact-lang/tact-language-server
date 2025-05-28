//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type * as lsp from "vscode-languageserver"
import type {TactFile} from "@server/languages/tact/psi/TactFile"
import {asLspRange} from "@server/utils/position"
import {RecursiveVisitor} from "@server/languages/tact/psi/RecursiveVisitor"

export class ParserErrorInspection {
    public inspect(file: TactFile): lsp.Diagnostic[] {
        const diagnostics: lsp.Diagnostic[] = []

        RecursiveVisitor.visit(file.rootNode, node => {
            if (node.isMissing) {
                diagnostics.push({
                    message: "Missing " + node.type,
                    range: asLspRange(node),
                })
            } else if (node.hasError && node.children.every(a => !a?.hasError)) {
                // if (!node.text.endsWith(';')) {
                //     diagnostics.push({
                //         message: 'Missing `;`',
                //         range: Range.create(node.endPosition.row - 1, node.endPosition.column, node.endPosition.row - 1, node.endPosition.column + 1),
                //     })
                //     return
                // }

                diagnostics.push({
                    message: "Syntax error",
                    range: asLspRange(node),
                })
            }
        })

        return diagnostics
    }
}
