//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type {Node as SyntaxNode} from "web-tree-sitter"
import type {TactFile} from "@server/languages/tact/psi/TactFile"
import {CallLike} from "@server/languages/tact/psi/TactNode"
import {crc32BigInt} from "@server/languages/tact/compiler/crc32"

const isWebEnvironment =
    typeof importScripts === "function" ||
    (typeof self !== "undefined" && typeof self.importScripts === "function")

let createHash: any

if (!isWebEnvironment) {
    try {
        const crypto = require("node:crypto")
        createHash = crypto.createHash
    } catch (error) {
        console.warn("Failed to load node:crypto:", error)
        createHash = (algorithm: string) => ({
            update: (data: string) => ({
                digest: () => Buffer.from("fallback", "utf8"),
            }),
        })
    }
} else {
    createHash = (algorithm: string) => ({
        update: (data: string) => ({
            digest: () => {
                // Простая заглушка - возвращаем Buffer с фиксированными данными
                const encoder = new TextEncoder()
                const arrayBuffer = encoder.encode(data + "fallback")
                const uint8Array = new Uint8Array(arrayBuffer)
                // Создаем Buffer-подобный объект
                return {
                    readUInt32BE: (offset: number) => {
                        // Простая хеш-функция для замены
                        let hash = 0
                        for (let i = 0; i < data.length; i++) {
                            const char = data.charCodeAt(i)
                            hash = (hash << 5) - hash + char
                            hash = hash & hash // Convert to 32bit integer
                        }
                        return Math.abs(hash)
                    },
                }
            },
        }),
    })
}

export function requireFunctionExitCode(
    callNode: SyntaxNode,
    file: TactFile,
    exitCodeFormat: "decimal" | "hex",
): {
    value: string
    node: SyntaxNode
} | null {
    const call = new CallLike(callNode, file)
    const rawArgs = call.rawArguments()
    const args = rawArgs.filter(value => value.type === "argument")
    if (args.length === 0) return null // no arguments, no need to resolve anything

    const message = args.at(-1)
    if (message && args.length > 1) {
        const content = message.text.slice(1, -1)
        const buff = createHash("sha256").update(content).digest()
        const code = (buff.readUInt32BE(0) % 63_000) + 1000

        return {
            value:
                exitCodeFormat === "hex" ? `0x${code.toString(16).toUpperCase()}` : code.toString(),
            node: message,
        }
    }

    return null
}

export function evalCrc32Builtin(rawStr: string): bigint {
    return crc32BigInt(rawStr)
}

export function evalAsciiBuiltin(rawStr: string): undefined | bigint {
    const str = processEscapes(rawStr)

    const encoded = new TextEncoder().encode(str)
    if (encoded.length > 32) {
        return undefined
    }

    if (encoded.length === 0) {
        return undefined
    }

    let hexString = ""
    for (const byte of encoded) {
        hexString += byte.toString(16).padStart(2, "0")
    }

    return BigInt(`0x${hexString}`)
}

function processEscapes(str: string): string {
    if (!str.includes("\\")) {
        return str
    }

    return str
        .replace(/\\x([\dA-Fa-f]{2})/g, (_, hex: string) =>
            String.fromCodePoint(Number.parseInt(hex, 16)),
        )
        .replace(/\\u([\dA-Fa-f]{4})/g, (_, hex: string) =>
            String.fromCodePoint(Number.parseInt(hex, 16)),
        )
        .replace(/\\u{([\dA-Fa-f]+)}/g, (_, hex: string) =>
            String.fromCodePoint(Number.parseInt(hex, 16)),
        )
}
