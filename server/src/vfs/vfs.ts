//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio

import {FileSystemProvider, VirtualFile, VFSConfig} from "./types"

/**
 * VFS instance with provider and cache
 */
export interface VFS {
    readonly provider: FileSystemProvider
    readonly config: VFSConfig
    readonly cache: Map<string, VirtualFile>
}

/**
 * Create a new VFS instance
 */
export function createVFS(provider: FileSystemProvider, config: Partial<VFSConfig> = {}): VFS {
    return {
        provider,
        config: {
            cacheEnabled: false,
            maxCacheSize: 1000,
            ...config,
        },
        cache: new Map(),
    }
}

/**
 * Read file content with optional caching
 */
export async function readFile(vfs: VFS, uri: string): Promise<VirtualFile | null> {
    // Check cache first
    if (vfs.config.cacheEnabled) {
        const cached = vfs.cache.get(uri)
        if (cached) {
            return cached
        }
    }

    // Read from provider
    const file = await vfs.provider.readFile(uri)

    // Cache the result
    if (file && vfs.config.cacheEnabled) {
        cacheFile(vfs, uri, file)
    }

    return file
}

/**
 * Check if file exists
 */
export async function exists(vfs: VFS, uri: string): Promise<boolean> {
    // Check cache first
    if (vfs.config.cacheEnabled) {
        const cached = vfs.cache.get(uri)
        if (cached) {
            return cached.exists
        }
    }

    return vfs.provider.exists(uri)
}

/**
 * List files in directory
 */
export async function listFiles(vfs: VFS, uri: string): Promise<string[]> {
    return vfs.provider.listFiles(uri)
}

/**
 * Invalidate cache for a specific file
 */
export function invalidateCache(vfs: VFS, uri: string): void {
    vfs.cache.delete(uri)
}

/**
 * Clear all cache
 */
export function clearCache(vfs: VFS): void {
    vfs.cache.clear()
}

/**
 * Get cache statistics
 */
export function getCacheStats(vfs: VFS): {size: number; maxSize: number} {
    return {
        size: vfs.cache.size,
        maxSize: vfs.config.maxCacheSize,
    }
}

/**
 * Cache a file (internal helper)
 */
function cacheFile(vfs: VFS, uri: string, file: VirtualFile): void {
    if (vfs.cache.size >= vfs.config.maxCacheSize) {
        const firstKey = vfs.cache.keys().next().value
        if (firstKey) {
            vfs.cache.delete(firstKey)
        }
    }

    vfs.cache.set(uri, file)
}
