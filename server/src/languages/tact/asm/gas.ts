//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import {AsmInstr} from "@server/languages/tact/psi/TactNode"
import {getStackPresentation} from "@server/languages/tact/completion/data/types"
import type {TactFile} from "@server/languages/tact/psi/TactFile"
import {Node as SyntaxNode} from "web-tree-sitter"

export interface GasConsumption {
    readonly value: number
    readonly unknown: boolean
    readonly exact: boolean
}

export async function computeSeqGasConsumption(
    arg: SyntaxNode,
    file: TactFile,
    gasSettings: {
        loopGasCoefficient: number
    },
): Promise<GasConsumption> {
    const instructions = arg.children
        .filter(it => it?.type === "asm_expression")
        .filter(it => it !== null)
        .map(it => new AsmInstr(it, file))

    return computeGasConsumption(instructions, gasSettings)
}

export async function computeGasConsumption(
    instructions: AsmInstr[],
    gasSettings: {
        loopGasCoefficient: number
    },
): Promise<GasConsumption> {
    let exact = true
    let res = 0

    for (const instr of instructions) {
        const info = await instr.info()
        if (!info || info.doc.gas === "") {
            exact = false
            continue
        }

        const args = instr.arguments()
        const continuations = args.filter(it => it.type === "asm_sequence")
        const continuationsGas = await Promise.all(
            continuations.map(async it => computeSeqGasConsumption(it, instr.file, gasSettings)),
        )

        exact &&= continuationsGas.reduce((prev, it) => prev && it.exact, true)

        // For if-else choose the most expensive branch
        if (
            (info.mnemonic.startsWith("IFELSE") || info.mnemonic.startsWith("IFREFELSEREF")) &&
            continuationsGas.length === 2
        ) {
            const trueBranchGas = continuationsGas[0].value
            const falseBranchGas = continuationsGas[1].value

            res += Math.max(falseBranchGas, trueBranchGas)
        } else {
            const allBranchesGas = continuationsGas.reduce((prev, gas) => prev + gas.value, 0)

            res +=
                info.mnemonic.startsWith("REPEAT") ||
                info.mnemonic.startsWith("UNTIL") ||
                info.mnemonic.startsWith("WHILE")
                    ? gasSettings.loopGasCoefficient * allBranchesGas
                    : allBranchesGas
        }

        if (info.doc.gas.includes("|") || info.doc.gas.includes("+")) {
            exact = false
        }
        if (
            info.mnemonic === "WHILE" ||
            info.mnemonic === "REPEAT" ||
            info.mnemonic === "UNTIL" ||
            info.mnemonic === "IFNOT" ||
            info.mnemonic === "IFREF" ||
            info.mnemonic === "IFNOTREF" ||
            info.mnemonic === "IFJMPREF" ||
            info.mnemonic === "IFNOTJMPREF" ||
            info.mnemonic === "IFREFELSEREF" ||
            info.mnemonic === "IFELSE" ||
            info.mnemonic === "IF"
        ) {
            exact = false
        }
        res += Number.parseInt(info.doc.gas)
    }

    return {
        value: res,
        unknown: false,
        exact,
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
