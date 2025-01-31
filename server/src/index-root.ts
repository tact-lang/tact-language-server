import {LRUMap} from "./utils/lruMap"
import {File} from "./psi/File"
import {glob} from "glob"
import {readFileSync} from "fs"
import {URI} from "vscode-uri"
import {createTactParser} from "./parser"
import {index} from "./indexes"
import {createFiftParser} from "./parser"

export const PARSED_FILES_CACHE = new LRUMap<string, File>({
    size: 100,
    dispose: _entries => {},
})

export const FIFT_PARSED_FILES_CACHE = new LRUMap<string, File>({
    size: 100,
    dispose: _entries => {},
})

export enum IndexRootKind {
    Stdlib = "stdlib",
    Workspace = "workspace",
}

export class IndexRoot {
    constructor(
        public root: string,
        public kind: IndexRootKind,
    ) {}

    async index() {
        const rootPath = this.root.slice(7)
        const files = await glob("**/*.tact", {
            cwd: rootPath,
            ignore: [
                "node_modules/**",
                "*/test/e2e-emulated/**",
                "**/__testdata/**",
                "**/test/**",
                "**/test-failed/**",
                "**/types/stmts-failed/**",
                "**/types/stmts/**",
                "**/tact-lang/compiler/**",
            ],
        })
        if (files.length === 0) {
            console.warn(`No file to index in ${this.root}`)
        }
        for (const filePath of files) {
            console.info("Indexing:", filePath)
            const uri = this.root + "/" + filePath
            const file = await findFile(uri)
            index.addFile(uri, file, false)
        }
    }
}

export async function findFile(uri: string, content?: string | undefined) {
    const cached = PARSED_FILES_CACHE.get(uri)
    if (cached !== undefined) {
        return cached
    }

    const realContent = content ?? readFileSync(URI.parse(uri).path).toString()
    const parser = createTactParser()
    const tree = parser.parse(realContent)
    const file = new File(uri, tree, realContent)
    PARSED_FILES_CACHE.set(uri, file)
    return file
}

export function findFiftFile(uri: string, content?: string): File {
    const cached = FIFT_PARSED_FILES_CACHE.get(uri)
    if (cached !== undefined) {
        return cached
    }

    const realContent = content ?? readFileSync(URI.parse(uri).path).toString()
    const parser = createFiftParser()
    const tree = parser.parse(realContent)
    const file = new File(uri, tree, realContent)
    FIFT_PARSED_FILES_CACHE.set(uri, file)
    return file
}
