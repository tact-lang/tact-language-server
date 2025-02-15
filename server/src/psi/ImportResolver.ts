import type {Node as SyntaxNode} from "web-tree-sitter"
import * as path from "node:path"
import {PARSED_FILES_CACHE} from "@server/index-root"
import type {File} from "./File"
import {existsSync} from "node:fs"
import {trimPrefix} from "@server/utils/strings"
import {projectStdlibPath} from "@server/toolchain/toolchain"

export class ImportResolver {
    public static resolveImport(fromFile: File, importPath: string): string | null {
        if (importPath.startsWith("@stdlib/")) {
            return this.resolveStdlibPath(importPath)
        }

        if (importPath.startsWith("./") || importPath.startsWith("../")) {
            return this.resolveLocalPath(fromFile, importPath)
        }

        return null
    }

    private static resolveLocalPath(file: File, localPath: string): string | null {
        const dir = path.dirname(file.path)
        const targetPath = path.join(dir, localPath) + ".tact"
        return this.checkFile(targetPath)
    }

    private static resolveStdlibPath(prefixedPath: string): string | null {
        const stdlibPath = projectStdlibPath
        if (!stdlibPath) return null

        const importPath = trimPrefix(prefixedPath, "@stdlib/")
        const targetPath = path.join(stdlibPath, "libs", importPath) + ".tact"
        return this.checkFile(targetPath)
    }

    private static checkFile(targetPath: string): string | null {
        if (!existsSync(targetPath)) return null
        return targetPath
    }

    private static toFile(targetPath: string): File | null {
        const targetUri = "file://" + targetPath
        return PARSED_FILES_CACHE.get(targetUri) ?? null
    }

    public static resolveAsFile(file: File, pathNode: SyntaxNode): File | null {
        const targetPath = this.resolveImport(file, pathNode.text.slice(1, -1))
        if (!targetPath) return null
        return this.toFile(targetPath)
    }

    public static resolveNode(file: File, pathNode: SyntaxNode): string | null {
        return this.resolveImport(file, pathNode.text.slice(1, -1))
    }
}
