//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import * as lsp from "vscode-languageserver"
import {TactFile} from "@server/languages/tact/psi/TactFile"
import {URI} from "vscode-uri"
import {MistiAnalyzer} from "@server/languages/tact/compiler/MistiAnalyzer"
import {Severity} from "@server/languages/tact/compiler/TactCompiler"
import {Inspection, InspectionIds} from "@server/languages/tact/inspections/Inspection"
import * as path from "node:path"
import {workspaceRoot} from "@server/toolchain"
import {getDocumentSettings} from "@server/settings/settings"
import {existsVFS, globalVFS} from "@server/vfs/files-adapter"
import {filePathToUri} from "@server/files"

export class MistiInspection implements Inspection {
    public readonly id: "misti" = InspectionIds.MISTI

    public async inspect(file: TactFile): Promise<lsp.Diagnostic[]> {
        if (file.fromStdlib) return []

        const configPath = path.join(workspaceRoot, "tact.config.json")
        const hasConfig = await existsVFS(globalVFS, filePathToUri(configPath))

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
