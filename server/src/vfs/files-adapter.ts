//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio

import {VFS, readFile, exists} from "./vfs"

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

/**
 * Convert file path to URI (keeping existing logic)
 */
export const filePathToUri = (filePath: string): string => {
    const url = new URL(`file://${filePath}`).toString()
    return url.replace(/c:/g, "c%3A").replace(/d:/g, "d%3A")
}

/**
 * Helper to read file content with fallback to empty string
 */
export async function readFileContentVFS(vfs: VFS, uri: string): Promise<string> {
    const content = await readFileVFS(vfs, uri)
    if (content === undefined) {
        console.error(`cannot read ${uri} file`)
        return ""
    }
    return content
}
