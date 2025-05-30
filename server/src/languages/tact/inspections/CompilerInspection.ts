//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import * as lsp from "vscode-languageserver"
import type {TactFile} from "@server/languages/tact/psi/TactFile"
import {TactCompiler} from "@server/languages/tact/compiler/TactCompiler"
import {Inspection, InspectionIds} from "./Inspection"
import {URI} from "vscode-uri"
import {workspaceRoot} from "@server/toolchain"
import * as path from "node:path"
import {existsVFS, globalVFS} from "@server/vfs/files-adapter"
import {filePathToUri} from "@server/files"

export class CompilerInspection implements Inspection {
    public readonly id: "tact-compiler-errors" = InspectionIds.COMPILER

    public async inspect(file: TactFile): Promise<lsp.Diagnostic[]> {
        if (file.fromStdlib) return []

        const configPath = path.join(workspaceRoot, "tact.config.json")
        const hasConfig = await existsVFS(globalVFS, filePathToUri(configPath))

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
