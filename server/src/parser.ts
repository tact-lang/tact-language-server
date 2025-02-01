import {Parser, Language} from "web-tree-sitter"

export let tactLanguage: Language
export let fiftLanguage: Language

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
    tactLanguage = await Language.load(tactLangUri)
    fiftLanguage = await Language.load(fiftLangUri)
}

export function createTactParser() {
    const parser = new Parser()
    parser.setLanguage(tactLanguage)
    return parser
}

export function createFiftParser() {
    const parser = new Parser()
    parser.setLanguage(fiftLanguage)
    return parser
}
