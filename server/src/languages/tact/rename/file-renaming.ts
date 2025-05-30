//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import {RenameFilesParams} from "vscode-languageserver"
import * as lsp from "vscode-languageserver"
import {ImportResolver} from "@server/languages/tact/psi/ImportResolver"
import {TactFile} from "@server/languages/tact/psi/TactFile"
import {asLspRange} from "@server/utils/position"
import {TextEdit} from "vscode-languageserver-types"
import {index} from "@server/languages/tact/indexes"
import {filePathToUri, findTactFile, PARSED_FILES_CACHE} from "@server/files"

export async function processFileRenaming(
    params: RenameFilesParams,
): Promise<lsp.WorkspaceEdit | null> {
    const changes: Record<lsp.DocumentUri, lsp.TextEdit[]> = {}

    for (const fileRename of params.files) {
        await processFileRename(fileRename, changes)
    }

    return Object.keys(changes).length > 0 ? {changes} : null
}

export function onFileRenamed(params: RenameFilesParams): void {
    for (const fileRename of params.files) {
        const oldUri = fileRename.oldUri
        const newUri = fileRename.newUri

        if (!oldUri.endsWith(".tact") || !newUri.endsWith(".tact")) {
            continue
        }

        console.info(`File renamed from ${oldUri} to ${newUri}`)

        const file = PARSED_FILES_CACHE.get(oldUri)
        if (file) {
            PARSED_FILES_CACHE.delete(oldUri)
            const newFile = new TactFile(newUri, file.tree, file.content)
            PARSED_FILES_CACHE.set(newUri, newFile)

            index.removeFile(oldUri)
            index.addFile(newUri, newFile)
        }
    }
}

async function processFileRename(
    fileRename: lsp.FileRename,
    changes: Record<string, TextEdit[]>,
): Promise<void> {
    const oldUri = fileRename.oldUri
    const newUri = fileRename.newUri

    if (!oldUri.endsWith(".tact") || !newUri.endsWith(".tact")) {
        return
    }

    console.info(`Processing rename from ${oldUri} to ${newUri}`)

    for (const [uri, file] of PARSED_FILES_CACHE.entries()) {
        if (uri === oldUri) continue // skip the file being renamed

        const imports = file.imports()
        const edits: lsp.TextEdit[] = []

        for (const importNode of imports) {
            const pathNode = importNode.childForFieldName("library")
            if (!pathNode) continue

            const importPath = pathNode.text.slice(1, -1) // without quotes
            const resolvedPath = ImportResolver.resolveImport(file, importPath, false)

            if (!resolvedPath || filePathToUri(resolvedPath) !== oldUri) {
                continue
            }

            const oldFile = await findTactFile(oldUri)
            const newFile = new TactFile(newUri, oldFile.tree, oldFile.content)
            const newImportPath = newFile.importPath(file)
            const range = asLspRange(pathNode)

            edits.push({
                range,
                newText: `"${newImportPath}"`,
            })

            console.info(`Updating import in ${uri}: "${importPath}" -> "${newImportPath}"`)
        }

        if (edits.length > 0) {
            changes[uri] = edits
        }
    }
}
