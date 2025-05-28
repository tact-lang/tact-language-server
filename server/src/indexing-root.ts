//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import {File} from "@server/languages/tact/psi/File"
import {glob} from "glob"
import * as fs from "node:fs"
import {URI} from "vscode-uri"
import {createTactParser, createFiftParser, createTlbParser} from "./parser"
import {index} from "@server/languages/tact/indexes"
import {measureTime} from "@server/languages/tact/psi/utils"
import {fileURLToPath, pathToFileURL} from "node:url"
import * as path from "node:path"

export const PARSED_FILES_CACHE: Map<string, File> = new Map()
export const FIFT_PARSED_FILES_CACHE: Map<string, File> = new Map()
export const TLB_PARSED_FILES_CACHE: Map<string, File> = new Map()

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
            const file = findFile(uri)
            index.addFile(uri, file, false)
        }
    }
}

export function findFile(uri: string, content?: string, changed: boolean = false): File {
    const normalizedUri = uri.replace(/\\/g, "/")

    const cached = PARSED_FILES_CACHE.get(normalizedUri)
    if (cached !== undefined && !changed) {
        return cached
    }

    const fsPath = URI.parse(normalizedUri).fsPath
    let realContent = content ?? safeFileRead(fsPath)
    if (!realContent) {
        console.error(`cannot read ${normalizedUri} file, path: ${fsPath}`)
        realContent = ""
    }

    const parser = createTactParser()
    const tree = measureTime(`reparse file ${normalizedUri}`, () => parser.parse(realContent))
    if (!tree) {
        throw new Error(`FATAL ERROR: cannot parse ${normalizedUri} file`)
    }

    const file = new File(normalizedUri, tree, realContent)
    PARSED_FILES_CACHE.set(normalizedUri, file)
    return file
}

export const filePathToUri = (filePath: string): string => {
    const url = pathToFileURL(filePath).toString()
    return url.replace(/c:/g, "c%3A").replace(/d:/g, "d%3A")
}

export function findFiftFile(uri: string, content?: string): File {
    const cached = FIFT_PARSED_FILES_CACHE.get(uri)
    if (cached !== undefined) {
        return cached
    }

    let realContent = content ?? safeFileRead(URI.parse(uri).fsPath)
    if (!realContent) {
        console.error(`cannot read ${uri} file`)
        realContent = ""
    }

    const parser = createFiftParser()
    const tree = parser.parse(realContent)
    if (!tree) {
        throw new Error(`FATAL ERROR: cannot parse ${uri} file`)
    }

    const file = new File(uri, tree, realContent)
    FIFT_PARSED_FILES_CACHE.set(uri, file)
    return file
}

export function findTlbFile(uri: string, content?: string): File {
    const cached = TLB_PARSED_FILES_CACHE.get(uri)
    if (cached && content === undefined) {
        return cached
    }

    let realContent = content ?? safeFileRead(URI.parse(uri).path)
    if (!realContent) {
        console.error(`cannot read ${uri} file`)
        realContent = ""
    }

    const tlbParser = createTlbParser()
    const tree = tlbParser.parse(realContent)
    if (!tree) {
        throw new Error(`FATAL ERROR: cannot parse ${uri} file`)
    }

    const file = new File(uri, tree, realContent)
    TLB_PARSED_FILES_CACHE.set(uri, file)
    return file
}

function safeFileRead(path: string): string | null {
    try {
        return fs.readFileSync(path).toString()
    } catch {
        return null
    }
}
