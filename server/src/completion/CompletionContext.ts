import {Node} from "@server/psi/Node"
import * as lsp from "vscode-languageserver/node"
import {parentOfType} from "@server/psi/utils"

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
    beforeSemicolon: boolean = false
    inNameOfFieldInit: boolean = false
    inMultilineStructInit: boolean = false
    inTraitList: boolean = false
    inParameter: boolean = false
    isMessageContext: boolean = false

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

        const symbolAfter = element.file.symbolAt(element.node.endIndex)
        this.beforeSemicolon = symbolAfter === ";"

        const parent = element.node.parent
        if (!parent) return

        if (parent.type !== "expression_statement" && parent.type !== "field_access_expression") {
            this.isExpression = true
        }

        if (parent.type === "expression_statement") {
            this.isStatement = true
        }

        const valueNode = parent.childForFieldName("value")
        if (parent.type === "instance_argument") {
            const nameNode = parent.childForFieldName("name")
            // hack for completion
            if (valueNode === null || parent.text.includes("\n")) {
                // Foo { name }
                //       ^^^^
                this.inNameOfFieldInit = true

                const init = parentOfType(parent, "instance_expression")
                const args = init?.childForFieldName("arguments")
                if (args) {
                    const openBracket = args.firstChild
                    const closeBracket = args.lastChild
                    if (!openBracket || !closeBracket) return

                    if (openBracket.startPosition.row != closeBracket.startPosition.row) {
                        this.inMultilineStructInit = true
                    }
                }
            }
        }

        if (element.node.type === "type_identifier") {
            this.isType = true
        }

        if (parent.type === "bounced_type") {
            this.isMessageContext = true
        }

        if (parent.type === "parameter") {
            const grand = parent.parent
            if (grand?.type === "receive_function") {
                this.isMessageContext = true
            }
        }

        if (parent.type === "tlb_serialization") {
            this.inTlbSerialization = true
            this.isExpression = false
            this.isStatement = false
        }

        if (parent.type === "ERROR" && parent.parent?.type === "parameter_list") {
            this.inParameter = true
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
            !this.inTlbSerialization &&
            !this.inNameOfFieldInit &&
            !this.inTraitList &&
            !this.inParameter
        )
    }
}
