import type {CompletionProvider} from "@server/completion/CompletionProvider"
import {CompletionItemKind} from "vscode-languageserver-types"
import type {CompletionContext} from "@server/completion/CompletionContext"
import {CompletionResult, CompletionWeight} from "@server/completion/WeightedCompletionItem"
import * as path from "node:path"
import * as fs from "node:fs"
import {File} from "@server/psi/File"
import {projectStdlibPath} from "@server/toolchain/toolchain"
import {trimSuffix} from "@server/utils/strings"

export class ImportPathCompletionProvider implements CompletionProvider {
    public isAvailable(ctx: CompletionContext): boolean {
        return ctx.insideImport
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

    public addCompletion(ctx: CompletionContext, result: CompletionResult): void {
        const file = ctx.element.file
        const currentDir = path.dirname(file.path)

        const importPath = trimSuffix(ctx.element.node.text.slice(1, -1), "DummyIdentifier")

        if (importPath.startsWith("@stdlib/") && projectStdlibPath) {
            const libsDir = path.join(projectStdlibPath, "libs")
            this.addEntries(libsDir, file, "", result)
            return
        }

        if (importPath.startsWith("./") || importPath.startsWith("../")) {
            const targetDir = path.join(currentDir, importPath)
            this.addEntries(targetDir, file, "", result)
            return
        }

        // On empty path:
        // import "<caret>";
        this.addEntries(currentDir, file, "./", result)

        result.add({
            label: "@stdlib/",
            kind: CompletionItemKind.Folder,
            weight: CompletionWeight.CONTEXT_ELEMENT,
        })
    }

    private addEntries(dir: string, file: File, prefix: string, result: CompletionResult): void {
        this.files(dir, file).forEach(name => {
            this.addFile(`${prefix}${name}`, result)
        })

        this.dirs(dir).forEach(name => {
            result.add({
                label: name + "/",
                kind: CompletionItemKind.Folder,
                weight: CompletionWeight.CONTEXT_ELEMENT,
            })
        })
    }

    private files(dir: string, currentFile: File): string[] {
        return fs
            .readdirSync(dir)
            .filter(file => file.endsWith(".tact"))
            .map(file => path.basename(file, ".tact"))
            .filter(name => name !== currentFile.name)
    }

    private dirs(dir: string): string[] {
        return fs.readdirSync(dir).filter(file => fs.lstatSync(path.join(dir, file)).isDirectory())
    }
}
