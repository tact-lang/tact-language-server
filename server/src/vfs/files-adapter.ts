//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio

import {VFS, readFile, exists} from "./vfs"

export {globalVFS} from "./global"

/**
 * VFS-based replacement for readOrUndefined function
 */
export async function readFileVFS(vfs: VFS, uri: string): Promise<string | undefined> {
    try {
        const file = await readFile(vfs, uri)
        return file?.exists ? file.content : undefined
    } catch {
        return undefined
    }
}

/**
 * VFS-based file existence check
 */
export async function existsVFS(vfs: VFS, uri: string): Promise<boolean> {
    try {
        return await exists(vfs, uri)
    } catch {
        return false
    }
}
