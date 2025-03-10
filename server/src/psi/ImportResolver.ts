import type {Node as SyntaxNode} from "web-tree-sitter"
import * as path from "node:path"
import {PARSED_FILES_CACHE} from "@server/indexing-root"
import type {File} from "./File"
import {existsSync} from "node:fs"
import {trimPrefix, trimSuffix} from "@server/utils/strings"
import {projectStdlibPath} from "@server/toolchain/toolchain"

export class ImportResolver {
    public static resolveImport(fromFile: File, importPath: string, check: boolean): string | null {
        if (importPath.startsWith("@stdlib/")) {
            return this.resolveStdlibPath(importPath, check)
        }

        if (importPath.startsWith("./") || importPath.startsWith("../")) {
            return this.resolveLocalPath(fromFile, importPath, check)
        }

        return null
    }

    private static resolveLocalPath(file: File, localPath: string, check: boolean): string | null {
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

    private static toFile(targetPath: string): File | null {
        const targetUri = "file://" + targetPath
        return PARSED_FILES_CACHE.get(targetUri) ?? null
    }

    public static resolveAsFile(
        file: File,
        pathNode: SyntaxNode,
        check: boolean = true,
    ): File | null {
        const targetPath = this.resolveImport(file, pathNode.text.slice(1, -1), check)
        if (!targetPath) return null
        return this.toFile(targetPath)
    }

    public static resolveNode(
        file: File,
        pathNode: SyntaxNode,
        check: boolean = true,
    ): string | null {
        return this.resolveImport(file, pathNode.text.slice(1, -1), check)
    }
}
