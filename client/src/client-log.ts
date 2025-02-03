import * as vscode from "vscode"

let consoleLogChannel: vscode.OutputChannel | null = null

/*
  Using `console.log()` and similar on a client-side is wrong (you just don't see its output).
  Instead, we should write to OutputChannel.
  This channel is the same for the server also. It's convenient to see logs from both
client and server in one place while developing.
  Note, that on the server-side, `console.log()` is automatically bound to the channel.
  So, `consoleLog()` and similar (declared here) are for client usage only.
 */

export function createClientLog(): vscode.OutputChannel {
    if (!consoleLogChannel) {
        consoleLogChannel = vscode.window.createOutputChannel("Tact")
        consoleLogChannel.show(true)
    }
    return consoleLogChannel
}

function anyItemToString(item: unknown): string {
    if (item === null) {
        return "null"
    }
    if (item === undefined) {
        return "undefined"
    }
    if (item === "") {
        return '""'
    }
    if (Array.isArray(item)) {
        return "[\n  " + item.map(anyItemToString).join(",\n  ") + "\n]"
    }
    if (typeof item === "object") {
        let str = "{"
        for (const key in item) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            str += `${str.length === 1 ? "" : ","}\n  ${key}: ${anyItemToString(item[key])}`
        }
        return str.length === 1 ? "{}" : str + "\n}"
    }
    return item.toString()
}

export function consoleLog(...items: unknown[]) {
    consoleLogChannel?.appendLine("[client] " + items.map(anyItemToString).join(" "))
}

export function consoleWarn(...items: unknown[]) {
    consoleLogChannel?.appendLine("[client] [WARN] " + items.map(anyItemToString).join(" "))
}

export function consoleError(...items: unknown[]) {
    consoleLogChannel?.appendLine("[client] [ERROR] " + items.map(anyItemToString).join(" "))
}
