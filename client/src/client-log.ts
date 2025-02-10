import * as vscode from "vscode"

let consoleLogChannel: vscode.OutputChannel | null = null

export function createClientLog(): vscode.OutputChannel {
    if (!consoleLogChannel) {
        consoleLogChannel = vscode.window.createOutputChannel("Tact")

        if (process.env["TACT_LS_DEV"] === "true") {
            consoleLogChannel.show(true)
        }
    }
    return consoleLogChannel
}

export function consoleError(...items: unknown[]): void {
    consoleLogChannel?.appendLine(
        "[ERROR] " + items.map(element => itemToString(element)).join(" "),
    )
}

function itemToString(item: unknown): string {
    if (item === null) return "null"
    if (item === undefined) return "undefined"

    if (item instanceof Error) {
        return item.message
    }

    if (typeof item === "object") {
        try {
            return JSON.stringify(item, null, 2)
        } catch {
            return item.toString()
        }
    }

    return item.toString()
}
