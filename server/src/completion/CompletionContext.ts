import {Expression, Node} from "@server/psi/Node"
import type * as lsp from "vscode-languageserver/node"
import {parentOfType} from "@server/psi/utils"
import {MapTy, NullTy, OptionTy, Ty} from "@server/types/BaseTy"
import {TypeInferer} from "@server/TypeInferer"
import type {TactSettings} from "@server/utils/settings"

export class CompletionContext {
    public element: Node
    public position: lsp.Position
    public triggerKind: lsp.CompletionTriggerKind

    public isType: boolean = false
    public isExpression: boolean = false
    public isStatement: boolean = false
    public isSelectorExpressionInStatement: boolean = false
    public insideTraitOrContract: boolean = false
    public insideTrait: boolean = false
    public topLevel: boolean = false
    public topLevelInTraitOrContract: boolean = false
    public topLevelInStructOrMessage: boolean = false
    public inTlbSerialization: boolean = false
    public afterDot: boolean = false
    public beforeParen: boolean = false
    public beforeSemicolon: boolean = false
    public inNameOfFieldInit: boolean = false
    public inMultilineStructInit: boolean = false
    public inTraitList: boolean = false
    public inParameter: boolean = false
    public isMessageContext: boolean = false
    public isBouncedMessage: boolean = false
    public isInitOfName: boolean = false
    public afterFieldType: boolean = false

    public contextTy: Ty | null = null

    public settings: TactSettings

    public constructor(
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

        if (
            parent.type === "field_access_expression" &&
            parent.parent?.type === "expression_statement"
        ) {
            this.isSelectorExpressionInStatement = true
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

            const anchor = parent.childForFieldName("_completion_anchor")
            if (anchor && element.node.equals(anchor)) {
                this.afterFieldType = true
                this.isExpression = false
                this.isStatement = false
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
                this.isMessageContext = true
            }
        }

        if (parent.type === "parameter") {
            const grand = parent.parent
            if (grand?.type === "receive_function") {
                this.isMessageContext = true
            }
            if (grand?.type === "external_function") {
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

        if (
            parent.type.endsWith("_function") &&
            parent.childForFieldName("name")?.equals(this.element.node)
        ) {
            this.isExpression = false
            this.isStatement = false
            this.inParameter = true
        }

        if (parent.type === "asm_expression") {
            this.isExpression = false
        }

        if (parent.type === "ERROR" && parent.parent?.type.endsWith("_function")) {
            this.isExpression = false
            this.isStatement = false
            this.inParameter = true
        }

        if (parent.type === "trait_list") {
            this.inTraitList = true
        }

        if (parent.type === "initOf" && parent.childForFieldName("name")?.equals(element.node)) {
            this.isInitOfName = true
        }

        if (parent.type === "ERROR" && parent.parent?.type === "map_type") {
            this.isType = true
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
            !this.afterFieldType &&
            !this.isInitOfName
        )
    }
}
