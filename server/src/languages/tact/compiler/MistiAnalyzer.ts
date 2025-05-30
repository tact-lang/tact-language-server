//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import {CompilerError, Severity, TactCompiler} from "@server/languages/tact/compiler/TactCompiler"
import {TactSettings} from "@server/settings/settings"

const isWebEnvironment =
    typeof importScripts === "function" ||
    (typeof globalThis !== "undefined" && typeof globalThis.importScripts === "function")

export interface MistiJsonOutput {
    readonly kind: "warnings"
    readonly warnings: MistiProjectWarning[]
}

export interface MistiProjectWarning {
    readonly projectName?: string
    readonly warnings: string[]
}

export interface MistiWarning {
    readonly file: string
    readonly line: number | string
    readonly col: number | string
    readonly detectorId?: string
    readonly severity: string
    readonly message: string
}

export class MistiAnalyzer {
    private static parseCompilerOutput(output: string): CompilerError[] {
        const errors: CompilerError[] = []
        const jsonStart = output.indexOf("{")
        const jsonEnd = output.lastIndexOf("}")
        if (jsonStart === -1 || jsonEnd === -1) {
            return TactCompiler.parseCompilerOutput(output)
        }

        const jsonString = output.slice(jsonStart, jsonEnd + 1)
        try {
            const jsonData = JSON.parse(jsonString) as MistiJsonOutput
            for (const projectWarning of jsonData.warnings) {
                if (!Array.isArray(projectWarning.warnings)) continue

                for (const warningJSON of projectWarning.warnings) {
                    try {
                        const warning = JSON.parse(warningJSON) as MistiWarning
                        errors.push({
                            file: warning.file.trim(),
                            line: Number(warning.line) - 1,
                            character: Number(warning.col) - 1,
                            message: `[${warning.severity.toUpperCase()}] ${warning.message}`,
                            id: warning.detectorId ?? "",
                            severity: MistiAnalyzer.mapSeverity(warning.severity),
                        })
                    } catch {
                        console.error(`Failed to parse internal warning: ${warningJSON}`)
                    }
                }
            }
            return errors
        } catch (error: unknown) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            console.error(`Failed to parse JSON output: ${error}`)
        }

        return TactCompiler.parseCompilerOutput(output)
    }

    private static mapSeverity(sev: string): Severity {
        const s = sev.toUpperCase()
        if (s === "INFO") return Severity.INFO
        if (s === "LOW") return Severity.LOW
        if (s === "MEDIUM") return Severity.MEDIUM
        if (s === "HIGH") return Severity.HIGH
        if (s === "CRITICAL") return Severity.CRITICAL
        return Severity.HIGH
    }

    public static async checkFile(settings: TactSettings, path: string): Promise<CompilerError[]> {
        if (isWebEnvironment) {
            console.warn("MistiAnalyzer.checkFile not available in web environment")
            return []
        }
        return this.runMistiCommand(settings.linters.misti.binPath, "--output-format", "json", path)
    }

    public static async checkProject(settings: TactSettings): Promise<CompilerError[]> {
        if (isWebEnvironment) {
            console.warn("MistiAnalyzer.checkProject not available in web environment")
            return []
        }
        return this.runMistiCommand(
            settings.linters.misti.binPath,
            "./tact.config.json",
            "--output-format",
            "json",
        )
    }

    private static async runMistiCommand(...args: string[]): Promise<CompilerError[]> {
        if (isWebEnvironment) {
            return []
        }

        const cp = await import("node:child_process")
        return new Promise((resolve, reject) => {
            const process = cp.exec(args.join(" "), (_error, stdout, stderr) => {
                const output = stdout + "\n" + stderr
                const errors = this.parseCompilerOutput(output)
                resolve(errors)
            })

            process.on("error", error => {
                console.error(`Failed to start misti: ${error}`)
                reject(error)
            })
        })
    }
}
