import * as lsp from "vscode-languageserver"
import {TextDocument} from "vscode-languageserver-textdocument"
import {TactFile} from "@server/languages/tact/psi/TactFile"
import {pathToFileURL} from "node:url"
import {createFiftParser, createTactParser, createTlbParser, createFuncParser} from "@server/parser"
import * as fs from "node:fs"
import {FiftFile} from "@server/languages/fift/psi/FiftFile"
import {TlbFile} from "@server/languages/tlb/psi/TlbFile"
import {URI} from "vscode-uri"
import {FuncFile} from "@server/languages/func/psi/FuncFile"

export const PARSED_FILES_CACHE: Map<string, TactFile> = new Map()
export const FIFT_PARSED_FILES_CACHE: Map<string, FiftFile> = new Map()
export const TLB_PARSED_FILES_CACHE: Map<string, TlbFile> = new Map()
export const FUNC_PARSED_FILES_CACHE: Map<string, FuncFile> = new Map()

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
    return file
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

export function findFuncFile(uri: string): FuncFile {
    const cached = FUNC_PARSED_FILES_CACHE.get(uri)
    if (cached) {
        return cached
    }

    const rawContent = readOrUndefined(fileURLToPath(uri))
    if (rawContent === undefined) {
        console.error(`cannot read ${uri} file`)
    }

    const content = rawContent ?? ""
    return reparseFuncFile(uri, content)
}

export function reparseFuncFile(uri: string, content: string): FuncFile {
    const parser = createFuncParser()
    const tree = parser.parse(content)
    if (!tree) {
        throw new Error(`FATAL ERROR: cannot parse ${uri} file`)
    }

    const file = new FuncFile(uri, tree, content)
    FUNC_PARSED_FILES_CACHE.set(uri, file)
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

export const isFuncFile = (
    uri: string,
    event?: lsp.TextDocumentChangeEvent<TextDocument>,
): boolean => event?.document.languageId === "func" || uri.endsWith(".fc") || uri.endsWith(".func")

export const filePathToUri = (filePath: string): string => {
    const url = pathToFileURL(filePath).toString()
    return url.replace(/c:/g, "c%3A").replace(/d:/g, "d%3A")
}

function fileURLToPath(uri: string): string {
    const normalizedUri = uri.replace(/\\/g, "/")
    return URI.parse(normalizedUri).fsPath
}
