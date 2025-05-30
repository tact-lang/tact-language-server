//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import {toolchain} from "@server/toolchain"

const isWebEnvironment =
    typeof importScripts === "function" ||
    (typeof globalThis !== "undefined" && typeof globalThis.importScripts === "function")

export enum Severity {
    INFO = 1,
    LOW = 2,
    MEDIUM = 3,
    HIGH = 4,
    CRITICAL = 5,
}

export interface CompilerError {
    readonly line: number
    readonly character: number
    readonly message: string
    readonly file: string
    readonly length?: number
    readonly id: string
    readonly severity: Severity
}

export class TactCompiler {
    public static parseCompilerOutput(output: string): CompilerError[] {
        const errors: CompilerError[] = []
        const lines = output.split("\n")

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            const match =
                /^(Compilation error:|Syntax error:|Error:)([^:]+):(\d+):(\d+): (.+)$/.exec(line)
            if (!match) continue

            const [, _, file, lineNum, char, message] = match

            let length = 0

            for (let j = i + 1; j < lines.length; j++) {
                const nextLine = lines[j]
                if (
                    nextLine.startsWith("Compilation error:") ||
                    nextLine.startsWith("Syntax error:") ||
                    nextLine.startsWith("Error:")
                ) {
                    break
                }
                if (nextLine.includes("Line") || nextLine.includes("|") || nextLine.includes("^")) {
                    i = j
                }

                if (nextLine.includes("^")) {
                    length = nextLine.trim().length
                }
            }

            errors.push({
                file: file.trim(),
                line: Number.parseInt(lineNum, 10) - 1,
                character: Number.parseInt(char, 10) - 1,
                message,
                length,
                id: "",
                severity: Severity.CRITICAL,
            } satisfies CompilerError)
        }

        return errors
    }

    public static async checkFile(path: string): Promise<CompilerError[]> {
        if (isWebEnvironment) {
            console.warn("TactCompiler.checkFile not available in web environment")
            return []
        }
        return this.runCompilerCommand(toolchain.compilerPath, "--check", path)
    }

    public static async checkProject(): Promise<CompilerError[]> {
        if (isWebEnvironment) {
            console.warn("TactCompiler.checkProject not available in web environment")
            return []
        }
        return this.runCompilerCommand(
            toolchain.compilerPath,
            "--check",
            "--config",
            "./tact.config.json",
        )
    }

    private static async runCompilerCommand(...args: string[]): Promise<CompilerError[]> {
        if (isWebEnvironment) {
            return []
        }

        const cp = await import("node:child_process")
        return new Promise((resolve, reject) => {
            const process = cp.exec(args.join(" "), (_error, _stdout, stderr) => {
                const errors = this.parseCompilerOutput(stderr)
                resolve(errors)
            })

            process.on("error", error => {
                console.error(`Failed to start compiler: ${error}`)
                reject(error)
            })
        })
    }
}
