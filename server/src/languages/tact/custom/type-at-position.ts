import type {Node as SyntaxNode} from "web-tree-sitter"
import {TactFile} from "@server/languages/tact/psi/TactFile"
import {Ty} from "@server/languages/tact/types/BaseTy"
import {TypeInferer} from "@server/languages/tact/TypeInferer"
import {Expression} from "@server/languages/tact/psi/TactNode"
import {TypeAtPositionParams, TypeAtPositionResponse} from "@shared/shared-msgtypes"
import {asLspRange, asParserPoint} from "@server/utils/position"

export function provideTactTypeAtPosition(
    params: TypeAtPositionParams,
    file: TactFile,
): TypeAtPositionResponse {
    const cursorPosition = asParserPoint(params.position)
    const node = file.rootNode.descendantForPosition(cursorPosition)
    if (!node) return {type: null, range: null}

    const adjustedNode = getAdjustedNodeForType(node)

    const res = findTypeForNode(adjustedNode, file)
    if (!res) {
        return {
            type: "void or unknown",
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
    const parent = node.parent
    if (
        parent?.type === "method_call_expression" ||
        parent?.type === "static_call_expression" ||
        parent?.type === "instance_expression"
    ) {
        return parent
    }

    return node
}

function findTypeForNode(node: SyntaxNode, file: TactFile): {ty: Ty; node: SyntaxNode} | null {
    let nodeForType: SyntaxNode | null = node
    while (nodeForType) {
        const ty = TypeInferer.inferType(new Expression(nodeForType, file))
        if (ty) return {ty, node: nodeForType}
        nodeForType = nodeForType.parent
        if (nodeForType?.type.includes("statement")) break
    }

    return null
}
