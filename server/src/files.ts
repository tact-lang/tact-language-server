import * as lsp from "vscode-languageserver"
import {TextDocument} from "vscode-languageserver-textdocument"
import {TactFile} from "@server/languages/tact/psi/TactFile"
import {fileURLToPath, pathToFileURL} from "node:url"
import {createFiftParser, createTactParser, createTlbParser} from "@server/parser"
import * as fs from "node:fs"
import {FiftFile} from "@server/languages/fift/psi/FiftFile"
import {TlbFile} from "@server/languages/tlb/psi/TlbFile"
import {ContractDependencies} from "@server/languages/tact/psi/ContractDependencies"

export const PARSED_FILES_CACHE: Map<string, TactFile> = new Map()
export const FIFT_PARSED_FILES_CACHE: Map<string, FiftFile> = new Map()
export const TLB_PARSED_FILES_CACHE: Map<string, TlbFile> = new Map()

export function findTactFile(uri: string, changed: boolean = false): TactFile {
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

export function reparseTactFile(uri: string, content: string): TactFile {
    const parser = createTactParser()
    const tree = parser.parse(content)
    if (!tree) {
        throw new Error(`FATAL ERROR: cannot parse ${uri} file`)
    }

    const file = new TactFile(uri, tree, content)
    PARSED_FILES_CACHE.set(uri, file)

    ContractDependencies.clearCache()

    return file
}

export const filePathToUri = (filePath: string): string => {
    const url = pathToFileURL(filePath).toString()
    return url.replace(/c:/g, "c%3A").replace(/d:/g, "d%3A")
}

export function findFiftFile(uri: string): FiftFile {
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

export function reparseFiftFile(uri: string, content: string): FiftFile {
    const parser = createFiftParser()
    const tree = parser.parse(content)
    if (!tree) {
        throw new Error(`FATAL ERROR: cannot parse ${uri} file`)
    }

    const file = new FiftFile(uri, tree, content)
    FIFT_PARSED_FILES_CACHE.set(uri, file)
    return file
}

export function findTlbFile(uri: string): TlbFile {
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

export function reparseTlbFile(uri: string, content: string): TlbFile {
    const parser = createTlbParser()
    const tree = parser.parse(content)
    if (!tree) {
        throw new Error(`FATAL ERROR: cannot parse ${uri} file`)
    }

    const file = new TlbFile(uri, tree, content)
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
