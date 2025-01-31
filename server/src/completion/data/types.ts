import * as fs from "fs"
import * as path from "path"

export interface AsmInstruction {
    mnemonic: string
    doc: {
        opcode: string
        stack: string
        category: string
        description: string
        gas: string
        fift: string
        fift_examples: Array<{
            fift: string
            description: string
        }>
    }
    since_version: number
}

export interface AsmAlias {
    mnemonic: string
    alias_of: string
    doc_fift?: string
    doc_stack?: string
    description?: string
    operands: Record<string, number | string>
}

export interface AsmData {
    instructions: AsmInstruction[]
    aliases: AsmAlias[]
}

let data: AsmData | null = null

export function asmData(): AsmData {
    if (data !== null) {
        return data
    }

    const filePath = path.join(__dirname, "asm.json")
    const content = fs.readFileSync(filePath, "utf-8")
    data = JSON.parse(content) as AsmData
    return data
}

export function findInstruction(name: string): AsmInstruction | null {
    const data = asmData()
    const instruction = data.instructions.find(i => i.mnemonic === name)
    if (instruction) {
        return instruction
    }

    const alias = data.aliases.find(i => i.mnemonic === name)
    if (alias) {
        const instruction = data.instructions.find(i => i.mnemonic === alias.alias_of)
        if (instruction) {
            return instruction
        }
    }

    return null
}
