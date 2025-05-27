//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import * as path from "node:path"
import * as cp from "node:child_process"
import {SpawnSyncReturns} from "node:child_process"
import {existsSync} from "node:fs"
import * as console from "node:console"

export class InvalidToolchainError extends Error {
    public constructor(message: string) {
        super(message)
        this.name = "InvalidToolchainError"
    }
}

export class Toolchain {
    public readonly compilerPath: string
    public version: {
        number: string
        commit: string
    }

    public constructor(compilerPath: string) {
        this.compilerPath = compilerPath
        this.version = {
            number: "",
            commit: "",
        }
    }

    public static autoDetect(root: string): Toolchain {
        const candidatesPath = [
            path.join(root, "node_modules", ".bin", "tact"),
            path.join(root, "bin", "tact.js"), // path in compiler repo
        ]
        const foundPath = candidatesPath.find(it => existsSync(it))
        if (!foundPath) {
            console.info(`cannot find toolchain in:`)
            candidatesPath.forEach(it => {
                console.info(it)
            })
            return fallbackToolchain
        }

        return new Toolchain(foundPath).setVersion()
    }

    public static fromPath(path: string): Toolchain {
        return new Toolchain(path).validate()
    }

    public isTact16(): boolean {
        return this.version.number.startsWith("1.6")
    }

    private setVersion(): this {
        try {
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

    private validate(): this {
        try {
            const result = cp.execSync(`"${this.compilerPath}" -v`)
            const rawVersion = result.toString()
            const lines = rawVersion.split("\n")

            this.version = {
                number: lines[0] ?? "",
                commit: lines[1] ?? "",
            }
        } catch (error_: unknown) {
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
}

export let projectStdlibPath: string | null = null

export function setProjectStdlibPath(path: string | null): void {
    projectStdlibPath = path
}

export const fallbackToolchain = new Toolchain("./node_modules/.bin/tact")
