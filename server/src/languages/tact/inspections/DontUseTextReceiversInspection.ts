//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import * as lsp from "vscode-languageserver"
import type {TactFile} from "@server/languages/tact/psi/TactFile"
import {UnusedInspection} from "./UnusedInspection"
import {Inspection, InspectionIds} from "./Inspection"
import {asLspRange} from "@server/utils/position"

export class DontUseTextReceiversInspection extends UnusedInspection implements Inspection {
    public readonly id: "dont-use-text-receivers" = InspectionIds.DONT_USE_TEXT_RECEIVERS

    protected checkFile(file: TactFile, diagnostics: lsp.Diagnostic[]): void {
        if (file.fromStdlib) return

        const contracts = file.getContracts()
        for (const contract of contracts) {
            const functions = contract.messageFunctions()
            if (functions.length === 0) continue

            for (const f of functions) {
                const param = f.parameter()
                if (!param) continue // empty `receive()`
                if (param.type !== "string") continue // not `receive("hello")`

                diagnostics.push({
                    severity: lsp.DiagnosticSeverity.Warning,
                    range: asLspRange(param),
                    message: `Use binary messages instead of text messages to improve performance`,
                    source: "tact",
                    code: "performance",
                })
            }
        }
    }
}
