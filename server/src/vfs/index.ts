//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio

export type {FileSystemProvider, VirtualFile} from "./types"

export {createVFS, readFile, exists, listFiles, listDirs, glob} from "./vfs"
export type {VFS} from "./vfs"

export {createNodeFSProvider} from "./fs-provider"
export {createVSCodeProvider} from "./vscode-provider"
