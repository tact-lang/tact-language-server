import * as fs from "node:fs"
import * as path from "node:path"
import {Node as SyntaxNode} from "web-tree-sitter"

export interface AsmInstruction {
    mnemonic: string
    doc: {
        opcode: string
        stack: string
        category: string
        description: string
        gas: string
        fift: string
        fift_examples: {
            fift: string
            description: string
        }[]
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
    const content = fs.readFileSync(filePath, "utf8")
    data = JSON.parse(content) as AsmData
    return data
}

export function findInstruction(name: string, args: SyntaxNode[] = []): AsmInstruction | null {
    const data = asmData()

    const realName = adjustName(name, args)
    const instruction = data.instructions.find(i => i.mnemonic === realName)
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

function adjustName(name: string, args: SyntaxNode[]): string {
    if (name === "PUSHINT") {
        if (args.length === 0) return "PUSHINT_4"

        const arg = Number.parseInt(args[0].text)
        if (Number.isNaN(arg)) return "PUSHINT_4"

        if (arg >= 0 && arg <= 15) return "PUSHINT_4"
        if (arg >= -128 && arg <= 127) return "PUSHINT_8"
        if (arg >= -32_768 && arg <= 32_767) return "PUSHINT_16"

        return "PUSHINT_LONG"
    }

    if (name === "PUSH") {
        if (args.length === 1 && args[0].type === "asm_stack_register") return "PUSH"
        if (args.length === 2) return "PUSH2"
        if (args.length === 3) return "PUSH3"
        return name
    }

    if (name === "XCHG0") {
        return "XCHG_0I"
    }

    if (name === "XCHG") {
        return "XCHG_IJ"
    }

    return name
}
