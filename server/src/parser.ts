//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import {Parser, Language} from "web-tree-sitter"

export let tactLanguage: Language | null = null
export let fiftLanguage: Language | null = null
export let tlbLanguage: Language | null = null

export const initParser = async (
    treeSitterUri: string,
    tactLangUri: string,
    fiftLangUri: string,
    tlbLangUri: string,
): Promise<void> => {
    if (tactLanguage && fiftLanguage && tlbLanguage) {
        return
    }
    const options: object | undefined = {
        locateFile() {
            return treeSitterUri
        },
    }
    await Parser.init(options)
    tactLanguage = await Language.load(tactLangUri)
    fiftLanguage = await Language.load(fiftLangUri)
    tlbLanguage = await Language.load(tlbLangUri)
}

export function createTactParser(): Parser {
    const parser = new Parser()
    parser.setLanguage(tactLanguage)
    return parser
}

export function createFiftParser(): Parser {
    const parser = new Parser()
    parser.setLanguage(fiftLanguage)
    return parser
}

export function createTlbParser(): Parser {
    const parser = new Parser()
    parser.setLanguage(tlbLanguage)
    return parser
}
