//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio

import type {Node as SyntaxNode} from "web-tree-sitter"
import {FuncFile} from "@server/languages/func/psi/FuncFile"
import {FuncNode} from "@server/languages/func/psi/FuncNode"
import {FuncTypeInferer} from "@server/languages/func/TypeInferer"
import type {FuncTy} from "@server/languages/func/types/BaseTy"
import {TypeAtPositionParams, TypeAtPositionResponse} from "@shared/shared-msgtypes"
import {asLspRange, asParserPoint} from "@server/utils/position"

export function provideFuncTypeAtPosition(
    params: TypeAtPositionParams,
    file: FuncFile,
): TypeAtPositionResponse {
    const cursorPosition = asParserPoint(params.position)
    const node = file.rootNode.descendantForPosition(cursorPosition)
    if (!node) return {type: null, range: null}

    const adjustedNode = getAdjustedNodeForType(node)

    const res = findTypeForNode(adjustedNode, file)
    if (!res) {
        return {
            type: "unknown",
            range: asLspRange(node),
        }
    }

    const {ty, node: actualNode} = res

    return {
        type: ty.qualifiedName(),
        range: asLspRange(actualNode),
    }
}

function getAdjustedNodeForType(node: SyntaxNode): SyntaxNode {
    // If we're on a method name in a method call, use the method call node
    if (node.type === "identifier" && node.parent?.type === "method_call") {
        const methodNameField = node.parent.childForFieldName("method_name")
        if (methodNameField?.equals(node)) {
            return node.parent
        }
    }

    // If we're on the dot or tilde operator, use the method call
    if ((node.type === "." || node.type === "~") && node.parent?.type === "method_call") {
        return node.parent
    }

    return node
}

function findTypeForNode(node: SyntaxNode, file: FuncFile): {ty: FuncTy; node: SyntaxNode} | null {
    let nodeForType: SyntaxNode | null = node

    while (nodeForType) {
        const funcNode = new FuncNode(nodeForType, file)
        const ty = FuncTypeInferer.inferType(funcNode)

        if (ty) {
            return {ty, node: nodeForType}
        }

        nodeForType = nodeForType.parent

        // Don't go beyond statement boundaries for type inference
        if (nodeForType?.type.includes("statement")) {
            break
        }
    }

    return null
}
