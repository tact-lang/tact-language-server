//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type * as lsp from "vscode-languageserver"
import type {TactFile} from "@server/languages/tact/psi/TactFile"
import {UnusedInspection} from "./UnusedInspection"
import {RecursiveVisitor} from "@server/languages/tact/psi/RecursiveVisitor"
import {Inspection, InspectionIds} from "./Inspection"

export class UnusedVariableInspection extends UnusedInspection implements Inspection {
    public readonly id: "unused-variable" = InspectionIds.UNUSED_VARIABLE

    protected checkFile(file: TactFile, diagnostics: lsp.Diagnostic[]): void {
        RecursiveVisitor.visit(file.rootNode, node => {
            if (node.type === "destruct_bind") {
                // let Foo { name: otherName } = foo()
                //                 ^^^^^^^^^
                // or
                // let Foo { name } = foo()
                //           ^^^^
                const target = node.childForFieldName("bind") ?? node.childForFieldName("name")
                this.checkUnused(target, file, diagnostics, {
                    kind: "Variable",
                    code: "unused-variable",
                })
                return
            }

            if (node.type !== "let_statement") {
                return
            }

            const nameNode = node.childForFieldName("name")
            if (!nameNode) return
            this.checkUnused(nameNode, file, diagnostics, {
                kind: "Variable",
                code: "unused-variable",
            })
        })
    }
}
