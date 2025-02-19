import {AsmInstr} from "@server/psi/Node"
import {getStackPresentation} from "@server/completion/data/types"
import type {File} from "@server/psi/File"

export interface GasConsumption {
    value: number
    unknown: boolean
    exact: boolean
    singleInstr: boolean
}

export function computeGasConsumption(instructions: AsmInstr[]): GasConsumption {
    const singleInstructionBody = instructions.length === 1

    let exact = true
    let res = 0

    for (const instr of instructions) {
        const info = instr.info()
        if (!info || info.doc.gas === "") {
            exact = false
            continue
        }
        if (info.doc.gas.includes("|") || info.doc.gas.includes("+")) {
            exact = false
        }
        res += Number.parseInt(info.doc.gas)
    }

    if (!exact && singleInstructionBody) {
        return {
            value: 0,
            unknown: true,
            exact: false,
            singleInstr: true,
        }
    }

    return {
        value: res,
        unknown: false,
        exact,
        singleInstr: singleInstructionBody,
    }
}

export function calculatePushcontGas(instr: AsmInstr, file: File): GasConsumption | null {
    const args = instr.arguments()
    if (args.length === 0) return null

    const arg = args[0]
    if (arg.type !== "asm_sequence") return null

    const instructions = arg.children
        .filter(it => it?.type === "asm_expression")
        .filter(it => it !== null)
        .map(it => new AsmInstr(it, file))

    return computeGasConsumption(instructions)
}

export function instructionPresentation(
    gas: string | undefined,
    stack: string | undefined,
    format: string,
): string {
    if (!gas || gas === "") {
        return ": no data"
    }
    return format.replace("{gas}", gas).replace("{stack}", getStackPresentation(stack))
}
