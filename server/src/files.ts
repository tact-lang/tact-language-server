import * as lsp from "vscode-languageserver"
import {TextDocument} from "vscode-languageserver-textdocument"
import {File} from "@server/languages/tact/psi/File"
import {fileURLToPath, pathToFileURL} from "node:url"
import {createFiftParser, createTactParser, createTlbParser} from "@server/parser"
import * as fs from "node:fs"

export const PARSED_FILES_CACHE: Map<string, File> = new Map()
export const FIFT_PARSED_FILES_CACHE: Map<string, File> = new Map()
export const TLB_PARSED_FILES_CACHE: Map<string, File> = new Map()

export function findTactFile(uri: string, changed: boolean = false): File {
    const cached = PARSED_FILES_CACHE.get(uri)
    if (cached !== undefined && !changed) {
        return cached
    }

    const rawContent = readOrUndefined(fileURLToPath(uri))
    if (rawContent === undefined) {
        console.error(`cannot read ${uri} file`)
    }

    const content = rawContent ?? ""
    return reparseTactFile(uri, content)
}

export function reparseTactFile(uri: string, content: string): File {
    const parser = createTactParser()
    const tree = parser.parse(content)
    if (!tree) {
        throw new Error(`FATAL ERROR: cannot parse ${uri} file`)
    }

    const file = new File(uri, tree, content)
    PARSED_FILES_CACHE.set(uri, file)
    return file
}

export const filePathToUri = (filePath: string): string => {
    const url = pathToFileURL(filePath).toString()
    return url.replace(/c:/g, "c%3A").replace(/d:/g, "d%3A")
}

export function findFiftFile(uri: string): File {
    const cached = FIFT_PARSED_FILES_CACHE.get(uri)
    if (cached !== undefined) {
        return cached
    }

    const rawContent = readOrUndefined(fileURLToPath(uri))
    if (rawContent === undefined) {
        console.error(`cannot read ${uri} file`)
    }

    const content = rawContent ?? ""
    return reparseFiftFile(uri, content)
}

export function reparseFiftFile(uri: string, content: string): File {
    const parser = createFiftParser()
    const tree = parser.parse(content)
    if (!tree) {
        throw new Error(`FATAL ERROR: cannot parse ${uri} file`)
    }

    const file = new File(uri, tree, content)
    FIFT_PARSED_FILES_CACHE.set(uri, file)
    return file
}

export function findTlbFile(uri: string): File {
    const cached = TLB_PARSED_FILES_CACHE.get(uri)
    if (cached) {
        return cached
    }

    const rawContent = readOrUndefined(fileURLToPath(uri))
    if (rawContent === undefined) {
        console.error(`cannot read ${uri} file`)
    }

    const content = rawContent ?? ""
    return reparseTlbFile(uri, content)
}

export function reparseTlbFile(uri: string, content: string): File {
    const parser = createTlbParser()
    const tree = parser.parse(content)
    if (!tree) {
        throw new Error(`FATAL ERROR: cannot parse ${uri} file`)
    }

    const file = new File(uri, tree, content)
    TLB_PARSED_FILES_CACHE.set(uri, file)
    return file
}

function readOrUndefined(path: string): string | undefined {
    try {
        return fs.readFileSync(path, "utf8")
    } catch {
        return undefined
    }
}

export const isTactFile = (
    uri: string,
    event?: lsp.TextDocumentChangeEvent<TextDocument>,
): boolean => event?.document.languageId === "tact" || uri.endsWith(".tact")

export const isFiftFile = (
    uri: string,
    event?: lsp.TextDocumentChangeEvent<TextDocument>,
): boolean => event?.document.languageId === "fift" || uri.endsWith(".fif")

export const isTlbFile = (
    uri: string,
    event?: lsp.TextDocumentChangeEvent<TextDocument>,
): boolean => event?.document.languageId === "tlb" || uri.endsWith(".tlb")
