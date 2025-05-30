//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import {glob} from "glob"
import {index} from "@server/languages/tact/indexes"
import {fileURLToPath} from "node:url"
import * as path from "node:path"
import {filePathToUri, findTactFile} from "@server/files"

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

        const rootDir = fileURLToPath(this.root)
        const files = await glob("**/*.tact", {
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
