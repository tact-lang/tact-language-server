//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import {createVFS} from "./vfs"
import {createNodeFSProvider} from "./fs-provider"
import {createVSCodeProvider} from "./vscode-provider"

export const globalVFS = (() => {
    const isWebEnvironment =
        typeof globalThis !== "undefined" && typeof importScripts === "function"

    if (isWebEnvironment) {
        const provider = createVSCodeProvider()
        return createVFS(provider)
    } else {
        return createVFS(createNodeFSProvider())
    }
})()
