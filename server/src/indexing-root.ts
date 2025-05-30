//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import {globFiles} from "@server/utils/glob"
import {index} from "@server/languages/tact/indexes"
import * as path from "path"
import {filePathToUri, findTactFile} from "@server/files"
import {URI} from "vscode-uri"

export enum IndexingRootKind {
    Stdlib = "stdlib",
    Workspace = "workspace",
}

export class IndexingRoot {
    public constructor(
        public root: string,
        public kind: IndexingRootKind,
    ) {}

    public async index(): Promise<void> {
        const ignore =
            this.kind === IndexingRootKind.Stdlib
                ? []
                : [
                      ".git/**",
                      "allure-results/**",
                      "**/node_modules/**",
                      "**/cli/tact/output/**",
                      "**/dist/**",
                      "**/test/failed/**",
                      "**/optimizer/test/**",
                      "**/types/effects/**",
                      "**/grammar/**/test/**",
                      "**/test/compilation-failed/**",
                      "**/pretty-printer-output/**",
                      "**/types/test/**",
                      "**/renamer-expected/**",
                      "**/test/codegen/**",
                      "**/test/contracts/**",
                      "**/test/e2e-emulated/**",
                      "**/e2e-slow/**",
                      "**/__testdata/**",
                      "**/test-failed/**",
                      "**/types/stmts-failed/**",
                      "**/types/stmts/**",
                      "**/tact-lang/compiler/**",
                  ]

        let rootDir: string
        try {
            rootDir = this.root.startsWith("file://") ? uriToFilePath(this.root) : this.root
        } catch {
            rootDir = this.root
        }

        const files = await globFiles("**/*.tact", {
            cwd: rootDir,
            ignore: ignore,
        })
        if (files.length === 0) {
            console.warn(`No file to index in ${this.root}`)
        }
        for (const filePath of files) {
            console.info("Indexing:", filePath)
            const absPath = path.join(rootDir, filePath)
            const uri = filePathToUri(absPath)
            const file = await findTactFile(uri)
            index.addFile(uri, file, false)
        }
    }
}

function uriToFilePath(uri: string): string {
    const normalizedUri = uri.replace(/\\/g, "/")
    return URI.parse(normalizedUri).fsPath
}
