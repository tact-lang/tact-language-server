//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio

/* eslint-disable @typescript-eslint/require-await */
import {FileSystemProvider, VirtualFile} from "./types"

export function createVSCodeProvider(): FileSystemProvider {
    const virtualFiles: Map<string, string> = new Map()
    const virtualDirs: Map<string, Set<string>> = new Map()

    const initVirtualFS = () => {
        virtualDirs.set("", new Set([]))

        console.debug("VS Code provider initialized in web environment")
    }

    initVirtualFS()

    return {
        async readFile(uri: string): Promise<VirtualFile | null> {
            const content = virtualFiles.get(uri)
            if (content !== undefined) {
                return {
                    uri,
                    content,
                    exists: true,
                }
            }

            return {
                uri,
                content: "",
                exists: false,
            }
        },

        async exists(uri: string): Promise<boolean> {
            return virtualFiles.has(uri)
        },

        async listFiles(uri: string): Promise<string[]> {
            const dirContent = virtualDirs.get(uri)
            if (!dirContent) {
                return []
            }

            const files: string[] = []
            for (const item of dirContent) {
                const fullPath = uri ? `${uri}/${item}` : item
                if (virtualFiles.has(fullPath)) {
                    files.push(item)
                }
            }

            return files
        },

        async listDirs(uri: string): Promise<string[]> {
            const dirContent = virtualDirs.get(uri)
            if (!dirContent) {
                return []
            }

            const dirs: string[] = []
            for (const item of dirContent) {
                const fullPath = uri ? `${uri}/${item}` : item
                if (virtualDirs.has(fullPath)) {
                    dirs.push(item)
                }
            }

            return dirs
        },
    }
}
