//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import {
    GetGasConsumptionForSelectionParams,
    GetGasConsumptionForSelectionResponse,
} from "@shared/shared-msgtypes"
import {findFile} from "@server/indexing-root"
import {asParserPoint} from "@server/utils/position"
import type {Node as SyntaxNode, Point} from "web-tree-sitter"
import {RecursiveVisitor} from "@server/languages/tact/psi/RecursiveVisitor"
import {AsmInstr} from "@server/languages/tact/psi/Node"
import {getDocumentSettings} from "@server/utils/settings"
import {computeGasConsumption} from "@server/languages/tact/asm/gas"
import {File} from "@server/languages/tact/psi/File"

export async function selectionGasConsumption(
    params: GetGasConsumptionForSelectionParams,
): Promise<GetGasConsumptionForSelectionResponse> {
    try {
        const uri = params.textDocument.uri
        const file = findFile(uri)

        const startPoint = asParserPoint(params.range.start)
        const endPoint = asParserPoint(params.range.end)

        const asmFunction = findOuterAssemblyFunction(file, startPoint, endPoint)
        if (!asmFunction) {
            return {
                gasConsumption: null,
                error: "Selection is not within an assembly function",
            }
        }

        const selectedInstructions: AsmInstr[] = []
        RecursiveVisitor.visit(asmFunction, (node): boolean => {
            if (node.type === "asm_expression") {
                const nodeStart = node.startPosition
                const nodeEnd = node.endPosition

                if (
                    (nodeStart.row > startPoint.row ||
                        (nodeStart.row === startPoint.row &&
                            nodeStart.column >= startPoint.column)) &&
                    (nodeEnd.row < endPoint.row ||
                        (nodeEnd.row === endPoint.row && nodeEnd.column <= endPoint.column))
                ) {
                    selectedInstructions.push(new AsmInstr(node, file))
                }
            }
            return true
        })

        if (selectedInstructions.length === 0) {
            return {
                gasConsumption: {
                    value: 0,
                    exact: true,
                    unknown: false,
                },
            }
        }

        const settings = await getDocumentSettings(uri)
        const gasConsumption = computeGasConsumption(selectedInstructions, settings.gas)

        return {
            gasConsumption: {
                value: gasConsumption.value,
                exact: gasConsumption.exact,
                unknown: gasConsumption.unknown,
            },
        }
    } catch (error) {
        return {
            gasConsumption: null,
            error: `Error calculating gas consumption: ${error instanceof Error ? error.message : String(error)}`,
        }
    }
}

function findOuterAssemblyFunction(
    file: File,
    startPoint: Point,
    endPoint: Point,
): SyntaxNode | undefined {
    let asmFunction: SyntaxNode | undefined = undefined
    RecursiveVisitor.visit(file.rootNode, (node): boolean => {
        if (node.type === "asm_function") {
            const body = node.childForFieldName("body")
            if (
                body &&
                body.startPosition.row <= startPoint.row &&
                body.endPosition.row >= endPoint.row
            ) {
                asmFunction = body
                return false // stop searching
            }
        }
        return true
    })
    return asmFunction
}
