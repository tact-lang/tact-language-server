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

    async function walkDirectory(dirUri: string, currentPath: string): Promise<void> {
        try {
            const files = await listFiles(vfs, dirUri)
            const dirs = await listDirs(vfs, dirUri)

            // Проверяем файлы
            for (const file of files) {
                const filePath = currentPath ? `${currentPath}/${file}` : file

                // Проверяем, не игнорируется ли файл
                const isIgnored = ignore.some(ignorePattern =>
                    matchesPattern(filePath, ignorePattern),
                )

                if (!isIgnored && matchesPattern(filePath, pattern)) {
                    results.push(filePath)
                }
            }

            // Рекурсивно обходим директории
            for (const dir of dirs) {
                const dirPath = currentPath ? `${currentPath}/${dir}` : dir

                // Проверяем, не игнорируется ли директория
                const isIgnored = ignore.some(ignorePattern =>
                    matchesPattern(dirPath, ignorePattern),
                )

                if (!isIgnored) {
                    const childDirUri = `${dirUri}/${dir}`
                    await walkDirectory(childDirUri, dirPath)
                }
            }
        } catch (error) {
            // Игнорируем ошибки доступа к директориям
            console.debug(`Failed to read directory ${dirUri}:`, error)
        }
    }

    await walkDirectory(cwd, "")
    return results
}

function matchesPattern(filePath: string, pattern: string): boolean {
    const regexPattern = pattern
        .replace(/\*\*/g, ".*") // ** -> .*
        .replace(/\*/g, "[^/]*") // * -> [^/]*
        .replace(/\./g, "\\.") // . -> \.
        .replace(/\?/g, ".") // ? -> .

    const regex = new RegExp(`^${regexPattern}$`)
    return regex.test(filePath)
}
