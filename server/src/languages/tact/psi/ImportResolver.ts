//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type {Node as SyntaxNode} from "web-tree-sitter"
import * as path from "node:path"
import type {TactFile} from "./TactFile"
import {existsSync} from "node:fs"
import {trimPrefix, trimSuffix} from "@server/utils/strings"
import {projectStdlibPath} from "@server/languages/tact/toolchain/toolchain"
import {filePathToUri, PARSED_FILES_CACHE} from "@server/files"

export class ImportResolver {
    public static resolveImport(
        fromFile: TactFile,
        importPath: string,
        check: boolean,
    ): string | null {
        if (importPath.startsWith("@stdlib/")) {
            return this.resolveStdlibPath(importPath, check)
        }

        if (importPath.startsWith("./") || importPath.startsWith("../")) {
            return this.resolveLocalPath(fromFile, importPath, check)
        }

        return null
    }

    private static resolveLocalPath(
        file: TactFile,
        localPath: string,
        check: boolean,
    ): string | null {
        if (localPath.endsWith(".fc") || localPath.endsWith(".func")) return null

        const withoutExt = trimSuffix(localPath, ".tact")
        const dir = path.dirname(file.path)
        const targetPath = path.join(dir, withoutExt) + ".tact"
        return this.checkFile(targetPath, check)
    }

    private static resolveStdlibPath(prefixedPath: string, check: boolean): string | null {
        const stdlibPath = projectStdlibPath
        if (!stdlibPath) return null

        const importPath = trimPrefix(prefixedPath, "@stdlib/")
        const targetPath = path.join(stdlibPath, "libs", importPath) + ".tact"
        return this.checkFile(targetPath, check)
    }

    private static checkFile(targetPath: string, check: boolean): string | null {
        if (check && !existsSync(targetPath)) return null
        return targetPath
    }

    public static toFile(targetPath: string): TactFile | null {
        const targetUri = filePathToUri(targetPath)
        return PARSED_FILES_CACHE.get(targetUri) ?? null
    }

    public static resolveAsFile(
        file: TactFile,
        pathNode: SyntaxNode,
        check: boolean = true,
    ): TactFile | null {
        const targetPath = this.resolveImport(file, pathNode.text.slice(1, -1), check)
        if (!targetPath) return null
        return this.toFile(targetPath)
    }

    public static resolveNode(
        file: TactFile,
        pathNode: SyntaxNode,
        check: boolean = true,
    ): string | null {
        return this.resolveImport(file, pathNode.text.slice(1, -1), check)
    }
}
