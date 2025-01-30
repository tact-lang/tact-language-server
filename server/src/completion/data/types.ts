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
