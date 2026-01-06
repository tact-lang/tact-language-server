import * as lsp from "vscode-languageserver"
import {TextDocument} from "vscode-languageserver-textdocument"
import {TactFile} from "@server/languages/tact/psi/TactFile"
import {pathToFileURL} from "node:url"
import {createTactParser} from "@server/parser"
import {readFileVFS, globalVFS} from "@server/vfs/files-adapter"
import {URI} from "vscode-uri"

export const PARSED_FILES_CACHE: Map<string, TactFile> = new Map()

export async function findTactFile(uri: string, changed: boolean = false): Promise<TactFile> {
    const cached = PARSED_FILES_CACHE.get(uri)
    if (cached !== undefined && !changed) {
        return cached
    }

    const rawContent = await readOrUndefined(uri)
    if (rawContent === undefined) {
        console.error(`cannot read ${uri} file`)
    }

    const content = rawContent ?? ""
    return reparseTactFile(uri, content)
}

export function reparseTactFile(uri: string, content: string): TactFile {
    const parser = createTactParser()
    const tree = parser.parse(content)
    if (!tree) {
        throw new Error(`FATAL ERROR: cannot parse ${uri} file`)
    }

    const file = new TactFile(uri, tree, content)
    PARSED_FILES_CACHE.set(uri, file)
    return file
}

async function readOrUndefined(uri: string): Promise<string | undefined> {
    return readFileVFS(globalVFS, uri)
}

export function uriToFilePath(uri: string): string {
    return fileURLToPath(uri)
}

export const isTactFile = (
    uri: string,
    event?: lsp.TextDocumentChangeEvent<TextDocument>,
): boolean => event?.document.languageId === "tact" || uri.endsWith(".tact")

// export function filePathToUri(filePath: string): string {
//     return pathToFileURL(filePath).href
// }
export const filePathToUri = (filePath: string): string => {
    const url = pathToFileURL(filePath).toString()
    return url.replace(/c:/g, "c%3A").replace(/d:/g, "d%3A")
}

function fileURLToPath(uri: string): string {
    const normalizedUri = uri.replace(/\\/g, "/")
    return URI.parse(normalizedUri).fsPath
}
