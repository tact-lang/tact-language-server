import {ResolveState, ScopeProcessor} from "@server/psi/Reference"
import {NamedNode, Node} from "@server/psi/Node"
import {Constant, Contract, Field, Fun, Message, Primitive, Struct, Trait} from "@server/psi/Decls"
import {CompletionItem, InsertTextFormat, CompletionItemKind} from "vscode-languageserver-types"
import {TypeInferer} from "@server/TypeInferer"
import {CompletionContext} from "./CompletionContext"
import {
    CompletionWeight,
    contextWeight,
    WeightedCompletionItem,
} from "@server/completion/WeightedCompletionItem"
import {MessageTy, StructTy} from "@server/types/BaseTy"
import {tactCodeBlock} from "@server/documentation/documentation"
import {trimPrefix} from "@server/utils/strings"
import {File} from "@server/psi/File"

export interface CompletionItemAdditionalInformation {
    readonly name: string | undefined
    readonly file: File | undefined
    readonly elementFile: File | undefined
}

export class ReferenceCompletionProcessor implements ScopeProcessor {
    public constructor(private readonly ctx: CompletionContext) {}

    public result: Map<string, CompletionItem> = new Map()

    private allowedInContext(node: Node): boolean {
        if (node instanceof NamedNode && node.name() === "BaseTrait") return false

        if (this.ctx.isType) {
            if (this.ctx.isMessageContext) {
                // in `receive(msg: <caret>)` allow only messages
                return node instanceof Message
            }

            if (this.ctx.inTraitList) {
                // for trait list allow only traits
                return node instanceof Trait
            }

            if (this.ctx.isInitOfName || this.ctx.isCodeOfName) {
                // only contracts can be used in `initOf Name()` or in `codeOf Name`
                return node instanceof Contract
            }

            // for types, we want to complete only types
            return (
                node instanceof Trait ||
                node instanceof Struct ||
                node instanceof Message ||
                node instanceof Primitive
            )
        }

        if (this.ctx.inDestruct) {
            return node instanceof Field
        }

        // for non types context things like traits and primitives are prohibited
        if (node instanceof Trait || node instanceof Primitive) return false
        // but since structs and messages can be created like `Foo{}` we allow them
        if (node instanceof Struct || node instanceof Message) return true
        if (node instanceof Contract) return false // filter contracts for now

        return true
    }

    public execute(node: Node, state: ResolveState): boolean {
        if (!(node instanceof NamedNode)) return true

        const prefix = state.get("prefix") ?? ""
        const name = trimPrefix(trimPrefix(node.name(), "AnyMessage_"), "AnyStruct_")
        if (name.endsWith("DummyIdentifier") || name === "AnyStruct" || name === "AnyMessage") {
            return true
        }

        if (!this.allowedInContext(node)) {
            return true
        }

        const additionalData = {
            elementFile: node.file,
            file: this.ctx.element.file,
            name: name,
        }

        if (node instanceof Fun) {
            // don't add `self.` prefix for global functions
            const thisPrefix = prefix !== "" && node.owner() === null ? "" : prefix

            const signature = node.signaturePresentation()
            const hasNoParams =
                node.parameters().length === 0 || (node.withSelf() && node.parameters().length == 1)

            const needSemicolon = this.ctx.isStatement && !this.ctx.beforeSemicolon

            // We want to place cursor in parens only if there are any parameters to write.
            // and add brackets only if they are not there yet
            const parensPart = this.ctx.beforeParen ? "" : hasNoParams ? "()" : "($1)"
            const semicolonPart = needSemicolon ? "$2;$0" : ""
            const insertText = thisPrefix + name + parensPart + semicolonPart

            this.addItem({
                label: thisPrefix + name,
                kind: CompletionItemKind.Function,
                labelDetails: {
                    detail: signature,
                },
                documentation: tactCodeBlock(`fun ${name}${signature}`),
                insertText: insertText,
                insertTextFormat: InsertTextFormat.Snippet,
                weight: contextWeight(
                    CompletionWeight.FUNCTION,
                    this.ctx.matchContextTy(() => node.returnType()?.type()),
                ),
                data: additionalData,
            })
        } else if (node instanceof Struct || node instanceof Message) {
            // we don't want to add `{}` for type completion
            const bracesSnippet = this.ctx.isType ? "" : "{$1}"
            const braces = this.ctx.isType ? "" : "{}"

            this.addItem({
                label: name,
                labelDetails: {
                    detail: braces,
                },
                kind: CompletionItemKind.Struct,
                insertText: `${name}${bracesSnippet}$0`,
                insertTextFormat: InsertTextFormat.Snippet,
                weight: contextWeight(
                    CompletionWeight.STRUCT,
                    this.ctx.matchContextTy(() =>
                        node instanceof Struct
                            ? new StructTy(node.name(), node)
                            : new MessageTy(node.name(), node),
                    ),
                ),
                data: additionalData,
            })
        } else if (node instanceof Trait) {
            this.addItem({
                label: name,
                kind: CompletionItemKind.TypeParameter,
                insertText: `${name}$0`,
                insertTextFormat: InsertTextFormat.Snippet,
                weight: CompletionWeight.TRAIT,
                data: additionalData,
            })
        } else if (node instanceof Contract) {
            const parameters = node.initFunction()?.parametersPresentation() ?? "()"
            const suffix = this.ctx.isInitOfName ? parameters : ""
            const initFunction = node.initFunction()
            const needParens = this.ctx.isInitOfName && !this.ctx.beforeParen
            const hasParameters = initFunction !== null && initFunction.parameters().length > 0

            const insertSuffix = needParens ? (hasParameters ? "($1)" : "()") : ""

            this.addItem({
                label: name,
                labelDetails: {
                    detail: suffix,
                },
                kind: CompletionItemKind.Constructor,
                insertText: `${name}${insertSuffix}$0`,
                insertTextFormat: InsertTextFormat.Snippet,
                weight: CompletionWeight.CONTRACT,
                data: additionalData,
            })
        } else if (node instanceof Primitive) {
            this.addItem({
                label: name,
                kind: CompletionItemKind.Property,
                insertText: name,
                insertTextFormat: InsertTextFormat.Snippet,
                weight: CompletionWeight.PRIMITIVE,
                data: additionalData,
            })
        } else if (node instanceof Constant) {
            // don't add `self.` prefix for global constants
            const thisPrefix = prefix !== "" && node.owner() === null ? "" : prefix

            const typeNode = node.typeNode()
            const value = node.value()
            const valueType = typeNode?.type()?.qualifiedName() ?? ""
            this.addItem({
                label: thisPrefix + name,
                kind: CompletionItemKind.Constant,
                labelDetails: {
                    detail: ": " + valueType + " = " + (value?.node.text ?? "unknown"),
                },
                insertText: thisPrefix + name,
                insertTextFormat: InsertTextFormat.Snippet,
                weight: contextWeight(
                    CompletionWeight.CONSTANT,
                    this.ctx.matchContextTy(() => typeNode?.type()),
                ),
                data: additionalData,
            })
        } else if (node instanceof Field) {
            const owner = node.dataOwner()?.name() ?? ""

            // don't add `self.` for completion of field in init
            const thisPrefix = this.ctx.inNameOfFieldInit ? "" : prefix
            const comma = this.ctx.inMultilineStructInit ? "," : ""
            const suffix = this.ctx.inNameOfFieldInit ? `: $1${comma}$0` : ""

            const typeNode = node.typeNode()
            const valueType = typeNode?.type()?.qualifiedName() ?? ""
            const details = this.ctx.inNameOfFieldInit ? `: ${valueType} ` : ": " + valueType
            const labelSuffix = this.ctx.inNameOfFieldInit ? ` ` : "" // needed to distinguish from variable

            this.addItem({
                label: thisPrefix + name + labelSuffix,
                kind: CompletionItemKind.Property,
                labelDetails: {
                    detail: details,
                    description: ` of ${owner}`,
                },
                insertText: thisPrefix + name + suffix,
                insertTextFormat: InsertTextFormat.Snippet,
                weight: contextWeight(
                    CompletionWeight.FIELD,
                    this.ctx.matchContextTy(() => node.typeNode()?.type()),
                ),
                data: additionalData,
            })
        } else if (node.node.type === "identifier") {
            const parent = node.node.parent
            if (!parent) return true

            if (
                parent.type === "let_statement" ||
                parent.type === "foreach_statement" ||
                parent.type === "catch_clause"
            ) {
                const type = TypeInferer.inferType(node)
                const typeName = type?.qualifiedName() ?? "unknown"

                this.addItem({
                    label: name,
                    kind: CompletionItemKind.Variable,
                    labelDetails: {
                        description: ` ${typeName}`,
                    },
                    insertText: name,
                    insertTextFormat: InsertTextFormat.Snippet,
                    weight: contextWeight(
                        CompletionWeight.VARIABLE,
                        this.ctx.matchContextTy(() => type),
                    ),
                    data: additionalData,
                })
            }
        } else if (node.node.type === "parameter") {
            const parent = node.node.parent
            if (!parent) return true

            const type = TypeInferer.inferType(node)
            const typeName = type?.qualifiedName() ?? "unknown"

            this.addItem({
                label: name,
                kind: CompletionItemKind.Variable,
                labelDetails: {
                    description: ` ${typeName}`,
                },
                insertText: name,
                insertTextFormat: InsertTextFormat.Snippet,
                weight: contextWeight(
                    CompletionWeight.PARAM,
                    this.ctx.matchContextTy(() => type),
                ),
                data: additionalData,
            })
        } else {
            this.addItem({
                label: name,
                weight: CompletionWeight.LOWEST,
            })
        }

        return true
    }

    public addItem(node: WeightedCompletionItem): void {
        if (node.label === "") return
        const lookup = this.lookupString(node)
        const prev = this.result.get(lookup)
        if (prev && prev.kind === node.kind) return
        this.result.set(lookup, node)
    }

    private lookupString(item: WeightedCompletionItem): string {
        return (item.kind ?? 1).toString() + item.label
    }
}
