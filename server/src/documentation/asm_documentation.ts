import {asmData} from "@server/completion/data/types"

function formatOperands(operands: Record<string, number | string>): string {
    return Object.entries(operands)
        .map(([_, value]) => value.toString())
        .join(" ")
}

export function generateAsmDoc(word: string): string | null {
    const data = asmData()
    const upperWord = word.toUpperCase()

    const instruction = data.instructions.find(i => i.mnemonic === upperWord)
    if (instruction) {
        const gas = instruction.doc.gas.length > 0 ? instruction.doc.gas : `unknown`
        return [
            "```",
            `${instruction.mnemonic} (${instruction.doc.category})`,
            "```",
            `- Stack: \`${instruction.doc.stack}\``,
            `- Gas: \`${gas}\``,
            "",
            instruction.doc.description,
            "",
            instruction.doc.fift_examples.length > 0 ? "**Examples:**" : "",
            ...instruction.doc.fift_examples.map(
                ex => `\`\`\`\n${ex.fift}\n\`\`\`\n${ex.description}`,
            ),
        ].join("\n")
    }

    const alias = data.aliases.find(a => a.mnemonic === upperWord)
    if (alias) {
        const operandsStr = formatOperands(alias.operands)
        return [
            "```",
            `${alias.mnemonic}`,
            "```",
            `- Alias of: \`${operandsStr} ${alias.alias_of}\`\n`,
            alias.doc_stack ? `- Stack: \`${alias.doc_stack}\`\n` : "",
            "",
            alias.description || "",
            "",
            alias.doc_fift ? `Fift: ${alias.doc_fift}` : "",
        ]
            .filter(Boolean)
            .join("\n")
    }

    return null
}
