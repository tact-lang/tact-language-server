import {fallbackToolchain, Toolchain} from "@server/toolchain/toolchain"

export let toolchain: Toolchain = fallbackToolchain

export function setToolchain(chain: Toolchain): void {
    toolchain = chain
}

export let workspaceRoot: string = ""

export function setWorkspaceRoot(path: string): void {
    console.info(`Set ${path} as workspace root `)
    workspaceRoot = path
}
