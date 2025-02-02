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
import {StructTy} from "@server/types/BaseTy"

export class ReferenceCompletionProcessor implements ScopeProcessor {
    constructor(private ctx: CompletionContext) {}

    public result = new Map<string, CompletionItem>()

    private allowedInContext(node: Node): boolean {
        if (node instanceof Contract) return false // filter contracts for now
        if (node instanceof NamedNode && node.name() === "BaseTrait") return false

        if (this.ctx.isType) {
            if (this.ctx.isMessageContext) {
                // in `receive(msg: <caret>)` allow only messages
                return node instanceof Message
            }

            // for types, we want to complete only types
            return (
                node instanceof Trait ||
                node instanceof Struct ||
                node instanceof Message ||
                node instanceof Primitive
            )
        }

        if (this.ctx.inTraitList) {
            // for trait list allow only traits
            return node instanceof Trait
        }

        // for non types context things like traits and primitives are prohibited
        if (node instanceof Trait || node instanceof Primitive) return false
        // but since structs and messages can be created like `Foo{}` we allow them
        if (node instanceof Struct || node instanceof Message) return true

        return true
    }

    public execute(node: Node, state: ResolveState): boolean {
        if (!(node instanceof NamedNode)) return true

        const prefix = state.get("prefix") ? state.get("prefix") : ""
        const name = node.name()
        if (name.endsWith("DummyIdentifier") || name === "AnyStruct") return true

        if (!this.allowedInContext(node)) {
            return true
        }

        // const includes = this.ctx.element.file.includesFile(node.file.path)
        //
        // const lastImport = this.ctx.element.file.rootNode.children
        //     .filter(it => it?.type === "import")
        //     .at(-1)
        //
        // const diff = FileDiff.forFile(this.ctx.element.file.uri)
        //     .appendAsNextLine(lastImport!.endPosition.row, `import "${node.file.uri}";`)
        //     .toTextEdits()
        //
        // const finalDiff = !includes ? diff : []

        if (node instanceof Fun) {
            // don't add `self.` prefix for global functions
            const thisPrefix = prefix !== "" && node.owner() === null ? "" : (prefix ?? "")

            const signature = node.signatureText()
            const hasNoParams =
                node.parameters().length == 0 || (node.withSelf() && node.parameters().length == 1)

            const needSemicolon = this.ctx.isStatement && !this.ctx.beforeSemicolon

            // We want to place cursor in parens only if there are any parameters to write.
            const insertText =
                thisPrefix + name + (hasNoParams ? "()" : "($1)") + (needSemicolon ? "$2;$0" : "")

            this.addItem({
                label: thisPrefix + name,
                kind: CompletionItemKind.Function,
                labelDetails: {
                    detail: signature,
                },
                documentation: `fn ${name}${signature}`,
                insertText: insertText,
                insertTextFormat: InsertTextFormat.Snippet,
                weight: contextWeight(
                    CompletionWeight.FUNCTION,
                    this.ctx.matchContextTy(() => node.returnType()?.type()),
                ),
                // additionalTextEdits: finalDiff,
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
                    this.ctx.matchContextTy(() => new StructTy(node.name(), node)),
                ),
            })
        } else if (node instanceof Trait) {
            this.addItem({
                label: name,
                kind: CompletionItemKind.TypeParameter,
                insertText: `${name}$0`,
                insertTextFormat: InsertTextFormat.Snippet,
                weight: CompletionWeight.TRAIT,
            })
        } else if (node instanceof Contract) {
            // don't add contract in completion for now
            return true
        } else if (node instanceof Primitive) {
            this.addItem({
                label: name,
                kind: CompletionItemKind.Property,
                insertText: name,
                insertTextFormat: InsertTextFormat.Snippet,
                weight: CompletionWeight.PRIMITIVE,
            })
        } else if (node instanceof Constant) {
            // don't add `self.` prefix for global constants
            const thisPrefix = prefix !== "" && node.owner() === null ? "" : (prefix ?? "")

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
            })
        } else if (node instanceof Field) {
            const owner = node.dataOwner()?.name() ?? ""

            // don't add `self.` for completion of field in init
            const thisPrefix = this.ctx.inNameOfFieldInit ? "" : (prefix ?? "")
            const comma = this.ctx.inMultilineStructInit ? "," : ""
            const suffix = this.ctx.inNameOfFieldInit ? `: $1${comma}$0` : ""

            const typeNode = node.typeNode()
            const valueType = typeNode?.type()?.qualifiedName() ?? ""
            const details = this.ctx.inNameOfFieldInit ? `: <value>` : ": " + valueType
            const labelSuffix = this.ctx.inNameOfFieldInit ? ` ` : "" // needed to distinguish from variable

            this.addItem({
                label: thisPrefix + name + labelSuffix,
                kind: CompletionItemKind.Property,
                labelDetails: {
                    detail: details,
                    description: `of ${owner}`,
                },
                insertText: thisPrefix + name + suffix,
                insertTextFormat: InsertTextFormat.Snippet,
                weight: contextWeight(
                    CompletionWeight.FIELD,
                    this.ctx.matchContextTy(() => node.typeNode()?.type()),
                ),
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

                this.addItem({
                    label: name,
                    kind: CompletionItemKind.Variable,
                    labelDetails: {
                        description: type?.qualifiedName() ?? "unknown",
                    },
                    insertText: name,
                    insertTextFormat: InsertTextFormat.Snippet,
                    weight: contextWeight(
                        CompletionWeight.VARIABLE,
                        this.ctx.matchContextTy(() => type),
                    ),
                })
            }
        } else if (node.node.type === "parameter") {
            const parent = node.node.parent
            if (!parent) return true

            const type = TypeInferer.inferType(node)

            this.addItem({
                label: name,
                kind: CompletionItemKind.Variable,
                labelDetails: {
                    description: type?.qualifiedName() ?? "unknown",
                },
                insertText: name,
                insertTextFormat: InsertTextFormat.Snippet,
                weight: contextWeight(
                    CompletionWeight.PARAM,
                    this.ctx.matchContextTy(() => type),
                ),
            })
        } else {
            this.addItem({
                label: name,
                weight: CompletionWeight.LOWEST,
            })
        }

        return true
    }

    public addItem(node: WeightedCompletionItem) {
        if (node.label === "") return
        const prev = this.result.get(node.label)
        if (prev && prev.kind === node.kind) return
        this.result.set(node.label, node)
    }
}
