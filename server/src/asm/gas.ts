import {AsmInstr} from "@server/psi/Node"
import {getStackPresentation} from "@server/completion/data/types"

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
