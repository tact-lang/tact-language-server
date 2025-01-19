import {Node} from "../psi/Node"
import * as lsp from "vscode-languageserver/node"
import {parentOfType} from "../psi/utils"

export class CompletionContext {
    element: Node
    position: lsp.Position
    triggerKind: lsp.CompletionTriggerKind

    isType: boolean = false
    isExpression: boolean = false
    isStatement: boolean = false
    insideTraitOrContract: boolean = false
    insideTrait: boolean = false
    topLevel: boolean = false
    topLevelInTraitOrContract: boolean = false
    topLevelInStructOrMessage: boolean = false
    inTlbSerialization: boolean = false
    afterDot: boolean = false

    constructor(
        content: string,
        element: Node,
        position: lsp.Position,
        triggerKind: lsp.CompletionTriggerKind,
    ) {
        this.element = element
        this.position = position
        this.triggerKind = triggerKind

        const lines = content.split(/\n/g)
        if (lines[position.line] && lines[position.line][position.character - 1]) {
            const symbolAfter = lines[position.line][position.character - 1]
            this.afterDot = symbolAfter === "."
        }

        const parent = element.node.parent
        if (!parent) return

        if (parent.type !== "expression_statement") {
            this.isExpression = true
        }

        if (parent.type === "expression_statement") {
            this.isStatement = true
        }

        if (element.node.type === "type_identifier") {
            this.isType = true
        }

        if (parent.type === "tlb_serialization") {
            this.inTlbSerialization = true
            this.isExpression = false
            this.isStatement = false
        }

        // skip additional ERROR node
        if (parent.type === "ERROR" && parent.parent?.type === "source_file") {
            this.topLevel = true
            this.isExpression = false
            this.isStatement = false
            this.isType = false
        }

        // skip additional ERROR node
        if (
            parent.type === "ERROR" &&
            (parent.parent?.type === "contract_body" || parent.parent?.type === "trait_body")
        ) {
            this.topLevelInTraitOrContract = true
            this.isExpression = false
            this.isStatement = false
            this.isType = false
        }

        // skip additional ERROR node
        if (
            parent.type === "ERROR" &&
            (parent.parent?.type === "struct_body" || parent.parent?.type === "message_body")
        ) {
            this.topLevelInStructOrMessage = true
            this.isExpression = false
            this.isStatement = false
            this.isType = false
        }

        const traitOrContractOwner = parentOfType(element.node, "contract", "trait")
        this.insideTraitOrContract = traitOrContractOwner !== null
        this.insideTrait = parentOfType(element.node, "trait") !== null
    }

    public expression(): boolean {
        return (
            (this.isExpression || this.isStatement) &&
            !this.isType &&
            !this.afterDot &&
            !this.inTlbSerialization
        )
    }
}
