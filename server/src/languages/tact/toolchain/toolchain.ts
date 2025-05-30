//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import * as path from "path"
import {EnvironmentInfo, ToolchainInfo} from "@shared/shared-msgtypes"
import {existsVFS, globalVFS} from "@server/vfs/files-adapter"
import {filePathToUri} from "@server/files"

const isWebEnvironment =
    typeof importScripts === "function" ||
    (typeof self !== "undefined" && typeof self.importScripts === "function")

export class InvalidToolchainError extends Error {
    public constructor(message: string) {
        super(message)
        this.name = "InvalidToolchainError"
    }
}

export class Toolchain {
    public readonly compilerPath: string
    public readonly isAutoDetected: boolean
    public readonly detectionMethod?: string
    public version: {
        number: string
        commit: string
    }

    public constructor(
        compilerPath: string,
        isAutoDetected: boolean = false,
        detectionMethod?: string,
    ) {
        this.compilerPath = compilerPath
        this.isAutoDetected = isAutoDetected
        this.detectionMethod = detectionMethod
        this.version = {
            number: "1.0.0",
            commit: "web-fallback",
        }
    }

    public static async autoDetect(root: string): Promise<Toolchain> {
        if (isWebEnvironment) {
            // В веб-окружении возвращаем заглушку
            return new Toolchain("@tact-lang/compiler", true, "web-fallback")
        }

        const candidatesPaths = [
            path.join(root, "node_modules", ".bin", "tact"),
            path.join(root, "bin", "tact.js"), // path in compiler repo
        ]
        const foundPath = await Toolchain.findDirectory(candidatesPaths)
        if (!foundPath) {
            console.info(`cannot find toolchain in:`)
            candidatesPaths.forEach(it => {
                console.info(it)
            })
            return fallbackToolchain
        }

        const detectionMethod = foundPath.includes("node_modules") ? "node_modules" : "project_bin"
        return new Toolchain(foundPath, true, detectionMethod).setVersion()
    }

    public static async fromPath(path: string): Promise<Toolchain> {
        if (isWebEnvironment) {
            return new Toolchain(path, false, "web-manual")
        }
        return new Toolchain(path, false, "manual").validate()
    }

    public isTact16(): boolean {
        return this.version.number.startsWith("1.6")
    }

    public async getEnvironmentInfo(): Promise<EnvironmentInfo> {
        if (isWebEnvironment) {
            return {
                nodeVersion: undefined,
                platform: "web",
                arch: "unknown",
            }
        }

        let platform = "unknown"
        let arch = "unknown"

        try {
            const os = await import("node:os")
            platform = os.platform()
            arch = os.arch()

            const cp = await import("node:child_process")
            const result = cp.execSync("node --version", {encoding: "utf8"})
            return {
                nodeVersion: result.trim(),
                platform: platform,
                arch: arch,
            }
        } catch {
            // node version not available
        }

        return {
            nodeVersion: undefined,
            platform: platform,
            arch: arch,
        }
    }

    public getToolchainInfo(): ToolchainInfo {
        return {
            path: this.compilerPath,
            isAutoDetected: this.isAutoDetected,
            detectionMethod: this.detectionMethod,
        }
    }

    private async setVersion(): Promise<this> {
        if (isWebEnvironment) {
            this.version = {
                number: "1.0.0",
                commit: "web-fallback",
            }
            return this
        }

        try {
            const cp = await import("node:child_process")
            const result = cp.execSync(`"${this.compilerPath}" -v`)
            const rawVersion = result.toString()
            const lines = rawVersion.split("\n")

            this.version = {
                number: lines[0] ?? "",
                commit: lines[1] ?? "",
            }
        } catch {
            // ignore errors here for now
        }
        return this
    }

    private async validate(): Promise<this> {
        if (isWebEnvironment) {
            return this
        }

        try {
            const cp = await import("node:child_process")
            const result = cp.execSync(`"${this.compilerPath}" -v`)
            const rawVersion = result.toString()
            const lines = rawVersion.split("\n")

            this.version = {
                number: lines[0] ?? "",
                commit: lines[1] ?? "",
            }
        } catch (error_: unknown) {
            interface SpawnSyncReturns<T> {
                readonly pid: number
                readonly output: (T | null)[]
                readonly stdout: T
                readonly stderr: T
                readonly status: number | null
                readonly signal: NodeJS.Signals | null
                readonly error?: Error | undefined
            }

            const error = error_ as SpawnSyncReturns<Buffer>

            console.log(error.stdout.toString())
            console.log(error.stderr.toString())

            const tip = `Please recheck path or leave it empty to LS find toolchain automatically`

            if (error.stderr.includes("not found")) {
                throw new InvalidToolchainError(
                    `Cannot find valid Tact executable in "${this.compilerPath}"! ${tip}`,
                )
            }

            throw new InvalidToolchainError(
                `Path ${this.compilerPath} is invalid! ${tip}: ${error.stderr.toString()}`,
            )
        }

        return this
    }

    public toString(): string {
        return `Toolchain(path=${this.compilerPath}, version=${this.version.number}:${this.version.commit})`
    }

    private static async findDirectory(dir: string[]): Promise<string | null> {
        for (const searchDir of dir) {
            if (await existsVFS(globalVFS, filePathToUri(searchDir))) {
                return searchDir
            }
        }

        return null
    }
}

export let projectStdlibPath: string | null = null

export function setProjectStdlibPath(path: string | null): void {
    projectStdlibPath = path
}

export const fallbackToolchain = new Toolchain("./node_modules/.bin/tact", true, "fallback")
