import * as cp from "child_process"
import * as path from "path"
import {Logger} from "@server/utils/logger"

export enum Severity {
    INFO = 1,
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL,
}

export interface CompilerError {
    severity: Severity
    line: number
    character: number
    message: string
    file: string
    length?: number
}

interface MistiJsonOutput {
    kind: "warnings"
    warnings: MistiProjectWarning[]
}

interface MistiProjectWarning {
    projectName?: string
    warnings: string[]
}

interface MistiWarning {
    file: string
    line: number | string
    col: number | string
    detectorId?: string
    severity: string
    message: string
}

export class MistiAnalyzer {
    private static parseCompilerOutput(output: string): CompilerError[] {
        const errors: CompilerError[] = []
        const jsonStart = output.indexOf("{")
        if (jsonStart === -1) {
            return MistiAnalyzer.parseTactCompilerOutput(output)
        }

        const jsonString = output.substring(jsonStart)
        try {
            const jsonData = JSON.parse(jsonString) as MistiJsonOutput
            for (const projectWarning of jsonData.warnings) {
                if (!Array.isArray(projectWarning.warnings)) continue

                for (const warningStr of projectWarning.warnings) {
                    try {
                        const warning = JSON.parse(warningStr) as MistiWarning
                        const errorObj: CompilerError = {
                            file: warning.file,
                            line: Number(warning.line) - 1,
                            character: Number(warning.col) - 1,
                            message: `[${warning.severity.toUpperCase()}] ${warning.detectorId ? warning.detectorId + ": " : ""}${warning.message}`,
                            severity: MistiAnalyzer.mapSeverity(warning.severity),
                        }
                        errors.push(errorObj)
                        console.info(
                            `[MistiAnalyzer] Parsed warning from JSON: ${JSON.stringify(errorObj)}`,
                        )
                    } catch (innerError) {
                        console.error(`Failed to parse internal warning: ${warningStr}`)
                    }
                }
            }
            return errors
        } catch (e) {
            console.error(`Failed to parse JSON output: ${e}`)
        }

        return MistiAnalyzer.parseTactCompilerOutput(output)
    }

    static parseTactCompilerOutput(output: string): CompilerError[] {
        const errors: CompilerError[] = []
        const lines = output.split("\n")
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            const match =
                /^(Compilation error:|Syntax error:|Error:)\s*([^:]+):(\d+):(\d+):\s*(.+)$/.exec(
                    line,
                )
            if (!match) continue
            const prefix = match[1]
            const file = match[2]
            const lineNum = match[3]
            const char = match[4]
            const rawMessage = match[5]
            let fullMessage = `${prefix} ${file}:${lineNum}:${char}: ${rawMessage}\n`
            let contextFound = false
            for (let j = i + 1; j < lines.length; j++) {
                const nextLine = lines[j]
                if (
                    nextLine.startsWith("Compilation error:") ||
                    nextLine.startsWith("Syntax error:") ||
                    nextLine.startsWith("Error:")
                )
                    break
                if (nextLine.includes("Line") || nextLine.includes("|") || nextLine.includes("^")) {
                    contextFound = true
                    fullMessage += nextLine + "\n"
                    i = j
                }
            }
            const error: CompilerError = {
                file,
                line: parseInt(lineNum, 10) - 1,
                character: parseInt(char, 10) - 1,
                message: fullMessage.trim(),
                severity: Severity.HIGH,
            }

            if (contextFound) {
                const caretLine = fullMessage.split("\n").find(l => l.includes("^"))
                if (caretLine) error.length = caretLine.trim().length
            }
            errors.push(error)
            console.info(`[MistiAnalyzer] Parsed error: ${JSON.stringify(error)}`)
        }
        return errors
    }

    private static mapSeverity(sev: string): Severity {
        switch (sev.toUpperCase()) {
            case "INFO":
                return Severity.INFO
            case "LOW":
                return Severity.LOW
            case "MEDIUM":
                return Severity.MEDIUM
            case "HIGH":
                return Severity.HIGH
            case "CRITICAL":
                return Severity.CRITICAL
            default:
                return Severity.HIGH
        }
    }

    static async analyze(_filePath: string): Promise<CompilerError[]> {
        return new Promise((resolve, reject) => {
            const process = cp.exec(
                `npx misti ./tact.config.json --output-format json`,
                (_error, stdout, stderr) => {
                    const output = stdout + "\n" + stderr
                    const errors = this.parseCompilerOutput(output)
                    resolve(errors)
                },
            )
            process.on("error", error => {
                console.error(`Failed to start misti: ${error}`)
                reject(error)
            })
        })
    }
}
