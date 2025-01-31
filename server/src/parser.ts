import * as Parser from "web-tree-sitter"

export let tactLanguage: Parser.Language
export let fiftLanguage: Parser.Language

export const initParser = async (
    treeSitterUri: string,
    tactLangUri: string,
    fiftLangUri: string,
) => {
    if (tactLanguage && fiftLanguage) {
        return
    }
    const options: object | undefined = {
        locateFile() {
            return treeSitterUri
        },
    }
    await Parser.init(options)
    tactLanguage = await Parser.Language.load(tactLangUri)
    fiftLanguage = await Parser.Language.load(fiftLangUri)
}

export function createTactParser() {
    const parser = new Parser()
    parser.setLanguage(tactLanguage)
    parser.setTimeoutMicros(1000 * 1000)
    return parser
}

export function createFiftParser() {
    const parser = new Parser()
    parser.setLanguage(fiftLanguage)
    parser.setTimeoutMicros(1000 * 1000)
    return parser
}
