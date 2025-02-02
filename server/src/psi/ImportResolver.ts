import {Node as SyntaxNode} from "web-tree-sitter"
import * as path from "path"
import {PARSED_FILES_CACHE} from "@server/index-root"
import {File} from "./File"
import {existsSync} from "fs"

export class ImportResolver {
    static resolveImport(fromFile: File, importPath: string): File | null {
        let currentDir = path.dirname(fromFile.uri.slice(7))
        if (importPath.startsWith("@stdlib") && currentDir.endsWith("sources")) {
            currentDir = path.dirname(currentDir)
        }

        if (importPath.startsWith("@stdlib")) {
            importPath = "./stdlib/std/" + importPath.substring("@stdlib".length + 1)
        }

        const resolved = importPath.startsWith("./") ? currentDir + importPath.slice(1) : importPath
        let targetPath = resolved + ".tact"

        if (!existsSync(targetPath)) {
            targetPath = targetPath.replace("/std/", "/libs/")
        }

        if (!existsSync(targetPath)) {
            return null
        }

        const targetUri = "file://" + targetPath
        return PARSED_FILES_CACHE.get(targetUri) ?? null
    }

    static resolveNode(file: File, pathNode: SyntaxNode): File | null {
        return this.resolveImport(file, pathNode.text.slice(1, -1))
    }
}
