//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import * as lsp from "vscode-languageserver"
import {File} from "@server/psi/File"
import {URI} from "vscode-uri"
import {MistiAnalyzer} from "@server/compiler/MistiAnalyzer"
import {Severity} from "@server/compiler/TactCompiler"
import {Inspection, InspectionIds} from "@server/inspections/Inspection"
import * as path from "node:path"
import {workspaceRoot} from "@server/toolchain"
import {existsSync} from "node:fs"
import {getDocumentSettings} from "@server/utils/settings"

export class MistiInspection implements Inspection {
    public readonly id: "misti" = InspectionIds.MISTI

    public async inspect(file: File): Promise<lsp.Diagnostic[]> {
        if (file.fromStdlib) return []

        const configPath = path.join(workspaceRoot, "tact.config.json")
        const hasConfig = existsSync(configPath)

        const settings = await getDocumentSettings(file.uri)

        try {
            const filePath = URI.parse(file.uri).fsPath

            const errors = hasConfig
                ? await MistiAnalyzer.checkProject(settings)
                : await MistiAnalyzer.checkFile(settings, filePath)

            return errors
                .filter(error => filePath.endsWith(error.file))
                .map(error => ({
                    severity: MistiInspection.mapSeverity(error.severity),
                    range: {
                        start: {
                            line: error.line,
                            character: error.character,
                        },
                        end: {
                            line: error.line,
                            character: error.character + (error.length ?? 1),
                        },
                    },
                    message: error.message,
                    source: "misti",
                    code: error.id,
                }))
        } catch {
            return []
        }
    }

    private static mapSeverity(sev: Severity): lsp.DiagnosticSeverity {
        if (sev === Severity.INFO) return lsp.DiagnosticSeverity.Information
        if (sev === Severity.LOW) return lsp.DiagnosticSeverity.Hint
        if (sev === Severity.MEDIUM) return lsp.DiagnosticSeverity.Warning
        if (sev === Severity.HIGH) return lsp.DiagnosticSeverity.Error
        return lsp.DiagnosticSeverity.Error
    }
}
