//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import * as lsp from "vscode-languageserver"
import type {File} from "@server/psi/File"
import {TactCompiler} from "@server/compiler/TactCompiler"
import {Inspection, InspectionIds} from "./Inspection"
import {URI} from "vscode-uri"
import {workspaceRoot} from "@server/toolchain"
import * as path from "node:path"
import {existsSync} from "node:fs"

export class CompilerInspection implements Inspection {
    public readonly id: "tact-compiler-errors" = InspectionIds.COMPILER

    public async inspect(file: File): Promise<lsp.Diagnostic[]> {
        if (file.fromStdlib) return []

        const configPath = path.join(workspaceRoot, "tact.config.json")
        const hasConfig = existsSync(configPath)

        try {
            const filePath = URI.parse(file.uri).fsPath

            const errors = hasConfig
                ? await TactCompiler.checkProject()
                : await TactCompiler.checkFile(filePath)

            return errors
                .filter(error => filePath.endsWith(error.file))
                .map(error => ({
                    severity: lsp.DiagnosticSeverity.Error,
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
                    source: "tact-compiler",
                    code: this.id,
                }))
        } catch {
            return []
        }
    }
}
