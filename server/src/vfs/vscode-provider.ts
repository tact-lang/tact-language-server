//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio

import {FileSystemProvider, VirtualFile} from "./types"
import {connection} from "@server/connection"

export function createVSCodeProvider(): FileSystemProvider {
    return {
        async readFile(uri: string): Promise<VirtualFile | null> {
            try {
                const content = await requestFileFromClientSync(uri)

                if (content === null) {
                    console.warn(`VFS: File not found on client: ${uri}`)
                    return {
                        uri,
                        content: "",
                        exists: false,
                    }
                } else {
                    return {
                        uri,
                        content,
                        exists: true,
                    }
                }
            } catch (error) {
                console.error(`VFS: Error reading file ${uri}:`, error)
                return {
                    uri,
                    content: "",
                    exists: false,
                }
            }
        },

        async exists(uri: string): Promise<boolean> {
            try {
                const file = await this.readFile(uri)
                return file?.exists ?? false
            } catch {
                return false
            }
        },

        async listFiles(uri: string): Promise<string[]> {
            try {
                const items = await requestDirectoryFromClientSync(uri)
                return items.filter(item => !item.endsWith("/"))
            } catch (error) {
                console.error(`VFS: Error listing files in ${uri}:`, error)
                return []
            }
        },

        async listDirs(uri: string): Promise<string[]> {
            try {
                const items = await requestDirectoryFromClientSync(uri)
                return items.filter(item => item.endsWith("/")).map(item => item.slice(0, -1))
            } catch (error) {
                console.error(`VFS: Error listing directories in ${uri}:`, error)
                return []
            }
        },
    }
}

export interface FileRequest {
    readonly uri: string
}

export interface FileResponse {
    readonly uri: string
    readonly content: string | null
    readonly exists: boolean
}

export interface DirectoryRequest {
    readonly uri: string
}

export interface DirectoryResponse {
    readonly uri: string
    readonly items: string[]
}

export async function requestFileFromClientSync(uri: string): Promise<string | null> {
    try {
        const request: FileRequest = {uri}
        const response: FileResponse = await connection.sendRequest("vfs/getFile", request)
        return response.exists ? response.content : null
    } catch (error) {
        console.error(`VFS: Error requesting file ${uri}:`, error)
        return null
    }
}

export async function requestDirectoryFromClientSync(uri: string): Promise<string[]> {
    try {
        const request: DirectoryRequest = {uri}
        const response: DirectoryResponse = await connection.sendRequest(
            "vfs/getDirectory",
            request,
        )
        return response.items
    } catch (error) {
        console.error(`VFS: Error requesting directory ${uri}:`, error)
        return []
    }
}
