//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio

/**
 * Represents a file in the virtual file system
 */
export interface VirtualFile {
    readonly uri: string
    readonly content: string
    readonly exists: boolean
}

/**
 * Simple file system provider interface
 */
export interface FileSystemProvider {
    /**
     * Read file content
     */
    readFile(uri: string): Promise<VirtualFile | null>

    /**
     * Check if a file exists
     */
    exists(uri: string): Promise<boolean>

    /**
     * List files in directory (for import autocompletion)
     */
    listFiles(uri: string): Promise<string[]>
}

/**
 * Virtual file system configuration
 */
export interface VFSConfig {
    readonly cacheEnabled: boolean
    readonly maxCacheSize: number
}
