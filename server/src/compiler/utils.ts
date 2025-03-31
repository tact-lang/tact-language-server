import type {Node as SyntaxNode} from "web-tree-sitter"
import type {File} from "@server/psi/File"
import {CallLike} from "@server/psi/Node"
import {createHash} from "node:crypto"

export function requireFunctionExitCode(
    callNode: SyntaxNode,
    file: File,
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

export function evalAsciiBuiltin(rawStr: string): bigint {
    const str = processEscapes(rawStr)

    const encoded = new TextEncoder().encode(str)
    if (encoded.length > 32) {
        return -1n
    }

    if (encoded.length === 0) {
        return 0n
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
