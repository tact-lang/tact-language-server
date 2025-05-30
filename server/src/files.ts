import {TextDocument} from "vscode-languageserver-textdocument"
import {TactFile} from "@server/languages/tact/psi/TactFile"
import {pathToFileURL} from "node:url"
import {createFiftParser, createTactParser, createTlbParser} from "@server/parser"
import {readFileVFS, globalVFS} from "@server/vfs/files-adapter"
import {FiftFile} from "@server/languages/fift/psi/FiftFile"
import {TlbFile} from "@server/languages/tlb/psi/TlbFile"
import {URI} from "vscode-uri"

export const PARSED_FILES_CACHE: Map<string, TactFile> = new Map()
export const FIFT_PARSED_FILES_CACHE: Map<string, FiftFile> = new Map()
export const TLB_PARSED_FILES_CACHE: Map<string, TlbFile> = new Map()

export async function findTactFile(uri: string, changed: boolean = false): Promise<File> {
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

export async function findFiftFile(uri: string): Promise<File> {
    const cached = FIFT_PARSED_FILES_CACHE.get(uri)
    if (cached !== undefined) {
        return cached
    }

    const rawContent = await readOrUndefined(uri)
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

export async function findTlbFile(uri: string, changed: boolean = false): Promise<File> {
    const cached = TLB_PARSED_FILES_CACHE.get(uri)
    if (cached !== undefined && !changed) {
        return cached
    }

    const rawContent = await readOrUndefined(uri)
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
        throw new Error(`Cannot parse file: ${uri}`)
    }

    const file = new TlbFile(uri, tree, content)
    TLB_PARSED_FILES_CACHE.set(uri, file)
    return file
}

async function readOrUndefined(uri: string): Promise<string | undefined> {
    return readFileVFS(globalVFS, uri)
}

export function filePathToUri(filePath: string): string {
    return pathToFileURL(filePath).href
}

export function uriToFilePath(uri: string): string {
    return fileURLToPath(uri)
}

export function isTactFile(uri: string, event?: {document: TextDocument}): boolean {
    return uri.endsWith(".tact") || event?.document.languageId === "tact"
}

export function isFiftFile(uri: string, event?: {document: TextDocument}): boolean {
    return uri.endsWith(".fif") || event?.document.languageId === "fift"
}

export function isTlbFile(uri: string, event?: {document: TextDocument}): boolean {
    return uri.endsWith(".tlb") || event?.document.languageId === "tlb"
}

export const filePathToUri = (filePath: string): string => {
    const url = pathToFileURL(filePath).toString()
    return url.replace(/c:/g, "c%3A").replace(/d:/g, "d%3A")
}

function fileURLToPath(uri: string): string {
    const normalizedUri = uri.replace(/\\/g, "/")
    return URI.parse(normalizedUri).fsPath
}
