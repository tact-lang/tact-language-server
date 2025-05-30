//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import {AsyncCompletionProvider} from "@server/languages/tact/completion/CompletionProvider"
import {CompletionItemKind} from "vscode-languageserver-types"
import type {CompletionContext} from "@server/languages/tact/completion/CompletionContext"
import {
    CompletionResult,
    CompletionWeight,
} from "@server/languages/tact/completion/WeightedCompletionItem"
import * as path from "node:path"
import {globalVFS} from "@server/vfs/global"
import {listDirs, listFiles} from "@server/vfs/vfs"
import {filePathToUri} from "@server/files"
import {TactFile} from "@server/languages/tact/psi/TactFile"
import {projectStdlibPath} from "@server/languages/tact/toolchain/toolchain"
import {trimSuffix} from "@server/utils/strings"

export class ImportPathCompletionProvider implements AsyncCompletionProvider {
    public isAvailable(ctx: CompletionContext): boolean {
        return ctx.insideImport
    }

    public async addCompletion(ctx: CompletionContext, result: CompletionResult): Promise<void> {
        const file = ctx.element.file
        const currentDir = path.dirname(file.path)

        const importPath = trimSuffix(ctx.element.node.text.slice(1, -1), "DummyIdentifier")

        if (importPath.startsWith("@stdlib/") && projectStdlibPath) {
            const libsDir = path.join(projectStdlibPath, "libs")
            await this.addEntries(libsDir, file, "", result)
            return
        }

        if (importPath.startsWith("./") || importPath.startsWith("../")) {
            const targetDir = path.join(currentDir, importPath)
            await this.addEntries(targetDir, file, "", result)
            return
        }

        // On empty path:
        // import "<caret>";
        await this.addEntries(currentDir, file, "./", result)

        result.add({
            label: "@stdlib/",
            kind: CompletionItemKind.Folder,
            weight: CompletionWeight.CONTEXT_ELEMENT,
        })
    }

    private async addEntries(
        dir: string,
        file: TactFile,
        prefix: string,
        result: CompletionResult,
    ): Promise<void> {
        const files = await this.files(dir, file)
        for (const name of files) {
            this.addFile(`${prefix}${name}`, result)
        }

        const dirs = await this.dirs(dir)
        for (const name of dirs) {
            result.add({
                label: name + "/",
                kind: CompletionItemKind.Folder,
                weight: CompletionWeight.CONTEXT_ELEMENT,
            })
        }
    }

    private addFile(name: string, result: CompletionResult): void {
        result.add({
            label: name,
            kind: CompletionItemKind.File,
            labelDetails: {
                detail: ".tact",
            },
            weight: CompletionWeight.CONTEXT_ELEMENT,
        })
    }

    private async files(dir: string, currentFile: TactFile): Promise<string[]> {
        try {
            const allFiles = await listFiles(globalVFS, filePathToUri(dir))
            return allFiles
                .filter(file => file.endsWith(".tact"))
                .map(file => path.basename(file, ".tact"))
                .filter(name => name !== currentFile.name)
        } catch {
            return []
        }
    }

    private async dirs(dir: string): Promise<string[]> {
        try {
            return await listDirs(globalVFS, filePathToUri(dir))
        } catch {
            return []
        }
    }
}
