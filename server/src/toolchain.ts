import {fallbackToolchain, Toolchain} from "@server/toolchain/toolchain"

export let toolchain: Toolchain = fallbackToolchain

export function setToolchain(chain: Toolchain): void {
    toolchain = chain
}
