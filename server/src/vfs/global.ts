//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio

import {createVFS, createDefaultProvider, VFS} from "./index"

/**
 * Global VFS instance for the language server
 */
export const globalVFS: VFS = createVFS(createDefaultProvider())
