//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio

/* eslint-disable @typescript-eslint/require-await */
import * as fs from "fs"
import * as path from "path"
import {FileSystemProvider, VirtualFile} from "./types"
import {URI} from "vscode-uri"

export function createNodeFSProvider(): FileSystemProvider {
    return {
        async readFile(uri: string): Promise<VirtualFile | null> {
            try {
                const filePath = uriToFilePath(uri)
                const content = fs.readFileSync(filePath, "utf8")

                return {
                    uri,
                    content,
                    exists: true,
                }
            } catch {
                return {
                    uri,
                    content: "",
                    exists: false,
                }
            }
        },

        async exists(uri: string): Promise<boolean> {
            try {
                const filePath = uriToFilePath(uri)
                return fs.existsSync(filePath)
            } catch {
                return false
            }
        },

        async listFiles(uri: string): Promise<string[]> {
            try {
                const dirPath = uriToFilePath(uri)
                const entries = fs.readdirSync(dirPath)

                const files: string[] = []

                for (const entry of entries) {
                    const fullPath = path.join(dirPath, entry)
                    const stat = fs.statSync(fullPath)

                    if (stat.isFile()) {
                        files.push(entry)
                    }
                }

                return files
            } catch {
                return []
            }
        },

        async listDirs(uri: string): Promise<string[]> {
            try {
                const dirPath = uriToFilePath(uri)
                const entries = fs.readdirSync(dirPath)

                const files: string[] = []

                for (const entry of entries) {
                    const fullPath = path.join(dirPath, entry)
                    const stat = fs.statSync(fullPath)

                    if (stat.isDirectory()) {
                        files.push(entry)
                    }
                }

                return files
            } catch {
                return []
            }
        },
    }
}

function uriToFilePath(uri: string): string {
    const normalizedUri = uri.replace(/\\/g, "/")
    return URI.parse(normalizedUri).fsPath
}
