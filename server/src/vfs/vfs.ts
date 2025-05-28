//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio

import {FileSystemProvider, VirtualFile} from "./types"

/**
 * Simple Virtual File System
 * Thin wrapper around file system provider
 */
export interface VFS {
    readonly provider: FileSystemProvider
}

/**
 * Create a new VFS instance
 */
export function createVFS(provider: FileSystemProvider): VFS {
    return {provider}
}

/**
 * Read file content
 */
export async function readFile(vfs: VFS, uri: string): Promise<VirtualFile | null> {
    return vfs.provider.readFile(uri)
}

/**
 * Check if file exists
 */
export async function exists(vfs: VFS, uri: string): Promise<boolean> {
    return vfs.provider.exists(uri)
}

/**
 * List files in directory
 */
export async function listFiles(vfs: VFS, uri: string): Promise<string[]> {
    return vfs.provider.listFiles(uri)
}
