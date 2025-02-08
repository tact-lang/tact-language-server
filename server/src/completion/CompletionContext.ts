import {Expression, Node} from "@server/psi/Node"
import * as lsp from "vscode-languageserver/node"
import {parentOfType} from "@server/psi/utils"
import {MapTy, NullTy, OptionTy, Ty} from "@server/types/BaseTy"
import {TypeInferer} from "@server/TypeInferer"
import {TactSettings} from "@server/utils/settings"

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
    beforeParen: boolean = false
    beforeSemicolon: boolean = false
    inNameOfFieldInit: boolean = false
    inMultilineStructInit: boolean = false
    inTraitList: boolean = false
    inParameter: boolean = false
    isMessageContext: boolean = false
    isBouncedMessage: boolean = false
    isInitOfName: boolean = false

    contextTy: Ty | null = null

    settings: TactSettings

    constructor(
        content: string,
        element: Node,
        position: lsp.Position,
        triggerKind: lsp.CompletionTriggerKind,
        settings: TactSettings,
    ) {
        this.element = element
        this.position = position
        this.triggerKind = triggerKind
        this.settings = settings

        const lines = content.split(/\n/g)
        const currentLine = lines[position.line]
        if (currentLine && currentLine[position.character - 1]) {
            const symbolAfter = currentLine[position.character - 1]
            this.afterDot = symbolAfter === "."
            const symbolAfterDummy = currentLine[position.character + "DummyIdentifier".length]
            this.beforeParen = symbolAfterDummy === "("
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

            if (nameNode !== null) {
                this.contextTy = TypeInferer.inferType(new Expression(nameNode, this.element.file))
            }
        }

        if (parent.type === "assignment_statement") {
            const left = parent.childForFieldName("left")
            if (left) {
                this.contextTy = TypeInferer.inferType(new Expression(left, this.element.file))
            }
        }

        if (parent.type === "let_statement") {
            const type = parent.childForFieldName("type")
            if (type) {
                this.contextTy = TypeInferer.inferType(new Expression(type, this.element.file))
            }
        }

        if (parent.type === "storage_variable" || parent.type === "field") {
            const type = parent.childForFieldName("type")
            if (type) {
                this.contextTy = TypeInferer.inferType(new Expression(type, this.element.file))
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
            if (grand?.type === "bounced_function") {
                this.isBouncedMessage = true
            }
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

        if (
            parent.type === "let_statement" &&
            parent.childForFieldName("name")?.equals(this.element.node)
        ) {
            this.isExpression = false
            this.isStatement = false
        }

        if (parent.type.endsWith("_function")) {
            this.isExpression = false
            this.isStatement = false
        }

        if (parent.type === "trait_list") {
            this.inTraitList = true
        }

        if (parent.type === "initOf" && parent.childForFieldName("name")?.equals(element.node)) {
            this.isInitOfName = true
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

    public matchContextTy(typeCb: () => Ty | null | undefined): boolean {
        if (!this.contextTy) return true
        if (!this.settings.completion.typeAware) return true

        const type = typeCb()
        if (!type) return false

        if (this.contextTy instanceof OptionTy && type instanceof OptionTy) {
            return this.contextTy.innerTy.name() === type.innerTy.name()
        }

        if (this.contextTy instanceof MapTy && type instanceof MapTy) {
            return true
        }

        if (this.contextTy instanceof OptionTy && type instanceof NullTy) {
            return true
        }

        if (type instanceof OptionTy) {
            // Int and Int?
            return type.innerTy.name() === this.contextTy.name()
        }

        if (this.contextTy instanceof OptionTy) {
            // Int? and Int
            return this.contextTy.innerTy.name() === type.name()
        }

        return this.contextTy.name() === type.name()
    }

    public expression(): boolean {
        return (
            (this.isExpression || this.isStatement) &&
            !this.isType &&
            !this.afterDot &&
            !this.inTlbSerialization &&
            !this.inNameOfFieldInit &&
            !this.inTraitList &&
            !this.inParameter &&
            !this.isInitOfName
        )
    }
}
