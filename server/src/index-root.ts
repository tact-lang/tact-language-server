import {File} from "@server/psi/File"
import {glob} from "glob"
import * as fs from "node:fs"
import {URI} from "vscode-uri"
import {createTactParser, createFiftParser} from "./parser"
import {index} from "./indexes"
import {measureTime} from "@server/psi/utils"

export const PARSED_FILES_CACHE: Map<string, File> = new Map()

export const FIFT_PARSED_FILES_CACHE: Map<string, File> = new Map()

export enum IndexRootKind {
    Stdlib = "stdlib",
    Workspace = "workspace",
}

export class IndexRoot {
    public constructor(
        public root: string,
        public kind: IndexRootKind,
    ) {}

    public async index(): Promise<void> {
        const rootPath = this.root.slice(7)

        const ignore =
            this.kind === IndexRootKind.Stdlib
                ? []
                : [
                      "**/node_modules/**",
                      "**/test/e2e-emulated/**",
                      "**/__testdata/**",
                      "**/test/**",
                      "**/test-failed/**",
                      "**/types/stmts-failed/**",
                      "**/types/stmts/**",
                      "**/tact-lang/compiler/**",
                  ]

        const files = await glob("**/*.tact", {
            cwd: rootPath,
            ignore: ignore,
        })
        if (files.length === 0) {
            console.warn(`No file to index in ${this.root}`)
        }
        for (const filePath of files) {
            console.info("Indexing:", filePath)
            const uri = this.root + "/" + filePath
            const file = findFile(uri)
            index.addFile(uri, file, false)
        }
    }
}

export function findFile(uri: string, content?: string, changed: boolean = false): File {
    const cached = PARSED_FILES_CACHE.get(uri)
    if (cached !== undefined && !changed) {
        return cached
    }

    let realContent = content ?? safeFileRead(URI.parse(uri).path)
    if (!realContent) {
        console.error(`cannot read ${uri} file`)
        realContent = ""
    }

    const parser = createTactParser()
    const tree = measureTime(`reparse file ${uri}`, () => parser.parse(realContent))
    if (!tree) {
        throw new Error(`FATAL ERROR: cannot parse ${uri} file`)
    }

    const file = new File(uri, tree, realContent)
    PARSED_FILES_CACHE.set(uri, file)
    return file
}

export function findFiftFile(uri: string, content?: string): File {
    const cached = FIFT_PARSED_FILES_CACHE.get(uri)
    if (cached !== undefined) {
        return cached
    }

    let realContent = content ?? safeFileRead(URI.parse(uri).path)
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

function safeFileRead(path: string): string | null {
    try {
        return fs.readFileSync(path).toString()
    } catch {
        return null
    }
}
