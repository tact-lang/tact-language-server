//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import {FileSystemProvider, VirtualFile} from "./types"

export interface VFS {
    readonly provider: FileSystemProvider
}

export function createVFS(provider: FileSystemProvider): VFS {
    return {provider}
}

export async function readFile(vfs: VFS, uri: string): Promise<VirtualFile | null> {
    return vfs.provider.readFile(uri)
}

export async function exists(vfs: VFS, uri: string): Promise<boolean> {
    return vfs.provider.exists(uri)
}

export async function listFiles(vfs: VFS, uri: string): Promise<string[]> {
    return vfs.provider.listFiles(uri)
}

export async function listDirs(vfs: VFS, uri: string): Promise<string[]> {
    return vfs.provider.listDirs(uri)
}

export async function glob(
    vfs: VFS,
    pattern: string,
    options: {
        cwd?: string
        ignore?: string[]
    },
): Promise<string[]> {
    const cwd = options.cwd ?? ""
    const ignore = options.ignore ?? []

    const results: string[] = []

    const ignoreRegexps = ignore.map(pattern => {
        const escapedPattern = pattern
            .replace(/\./g, "\\.")
            .replace(/\*\*/g, ".*")
            .replace(/\*/g, "[^/]*")
        return new RegExp(`^${escapedPattern}$`)
    })

    const shouldIgnore = (filePath: string): boolean => {
        return ignoreRegexps.some(regex => regex.test(filePath))
    }

    const compilePattern = (pattern: string): RegExp => {
        const escapedPattern = pattern
            .replace(/\./g, "\\.")
            .replace(/\*\*/g, ".*")
            .replace(/\*/g, "[^/]*")
        return new RegExp(`^${escapedPattern}$`)
    }

    const patternRegex = compilePattern(pattern)

    async function walkDirectory(dirUri: string, currentPath: string): Promise<void> {
        try {
            if (shouldIgnore(currentPath)) {
                return
            }

            const files = await listFiles(vfs, dirUri)
            const dirs = await listDirs(vfs, dirUri)

            for (const file of files) {
                const filePath = currentPath ? `${currentPath}/${file}` : file

                if (!shouldIgnore(filePath) && patternRegex.test(filePath)) {
                    results.push(filePath)
                }
            }

            for (const dir of dirs) {
                const dirPath = currentPath ? `${currentPath}/${dir}` : dir
                const subDirUri = dirUri ? `${dirUri}/${dir}` : dir

                if (!shouldIgnore(dirPath)) {
                    await walkDirectory(subDirUri, dirPath)
                }
            }
        } catch (error) {
            console.warn(`Error walking directory ${dirUri}:`, error)
        }
    }

    const startUri = cwd || ""
    await walkDirectory(startUri, "")

    return results.sort()
}
