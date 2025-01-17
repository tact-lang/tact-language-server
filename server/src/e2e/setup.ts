import * as vscode from "vscode"
import {before} from "mocha"

export async function activate(): Promise<void> {
    const ext = vscode.extensions.getExtension("tact-vscode")
    if (!ext) {
        throw new Error("Extension not found")
    }

    await ext.activate()
    await new Promise(resolve => setTimeout(resolve, 2000))

    if (!ext.isActive) {
        throw new Error("Extension failed to activate")
    }
}

before("activate extension", async () => {
    await activate()
})
