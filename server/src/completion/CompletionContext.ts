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

    constructor(element: Node, position: lsp.Position, triggerKind: lsp.CompletionTriggerKind) {
        this.element = element
        this.position = position
        this.triggerKind = triggerKind

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

        const traitOrContractOwner = parentOfType(element.node, "contract", "trait")
        this.insideTraitOrContract = traitOrContractOwner !== null
    }
}
