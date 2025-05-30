//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio

interface GlobOptions {
    readonly cwd?: string
    readonly ignore?: string[]
}

export async function globFiles(pattern: string, options: GlobOptions = {}): Promise<string[]> {
    const isNodeEnvironment = typeof process !== "undefined" && process.versions.node

    if (isNodeEnvironment) {
        try {
            const {glob} = await import("glob")
            return await glob(pattern, {
                cwd: options.cwd ?? process.cwd(),
                ignore: options.ignore ?? [],
            })
        } catch (error) {
            console.warn("Failed to import glob package, falling back to VFS:", error)
            return useVFSGlob(pattern, options)
        }
    } else {
        return useVFSGlob(pattern, options)
    }
}

async function useVFSGlob(pattern: string, options: GlobOptions): Promise<string[]> {
    try {
        const {glob, globalVFS} = await import("@server/vfs/files-adapter")
        const {filePathToUri} = await import("@server/files")

        let cwd = options.cwd ?? ""
        if (cwd && !cwd.startsWith("file://")) {
            cwd = filePathToUri(cwd)
        }

        return await glob(globalVFS, pattern, {
            cwd,
            ignore: options.ignore ?? [],
        })
    } catch (error) {
        console.error("Failed to use VFS glob:", error)
        return []
    }
}
