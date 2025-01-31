import {ResolveState, ScopeProcessor} from "../psi/Reference"
import {NamedNode, Node} from "../psi/Node"
import {Constant, Contract, Field, Fun, Message, Primitive, Struct, Trait} from "../psi/Decls"
import {CompletionItem, InsertTextFormat, CompletionItemKind} from "vscode-languageserver-types"
import {TypeInferer} from "../TypeInferer"
import {CompletionContext} from "./CompletionContext"

export class ReferenceCompletionProcessor implements ScopeProcessor {
    constructor(private ctx: CompletionContext) {}

    public result: Map<string, CompletionItem> = new Map()

    public execute(node: Node, state: ResolveState): boolean {
        if (!(node instanceof NamedNode)) return true

        const prefix = state.get("prefix") ? state.get("prefix") : ""
        const name = node.name()
        if (name.endsWith("DummyIdentifier") || name === "AnyStruct") return true

        if (
            this.ctx.inNameOfFieldInit &&
            node.node.type !== "identifier" &&
            !(node instanceof Field)
        ) {
            // For
            // Foo { n<caret> }
            // complete only local variables, parameters and fields
            // but for
            // Foo { name: <caret> }
            // complete everything
            return true
        }

        if (node instanceof Fun) {
            if (this.ctx.isType) {
                // don't add functions for type completion
                return true
            }

            // don't add `self.` prefix for global functions
            const thisPrefix = prefix !== "" && node.owner() === null ? "" : prefix

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
                sortText: `1${name}`,
            })
        } else if (node instanceof Struct || node instanceof Message) {
            if (this.ctx.inTraitList) return true

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
                sortText: `2${name}`,
            })
        } else if (node instanceof Trait) {
            if (name === "BaseTrait") return true
            const importance = this.ctx.inTraitList ? "0" : "3"

            this.addItem({
                label: name,
                kind: CompletionItemKind.TypeParameter,
                insertText: `${name}$0`,
                insertTextFormat: InsertTextFormat.Snippet,
                sortText: `${importance}${name}`,
            })
        } else if (node instanceof Contract) {
            // don't add contract in completion for now
            return true
        } else if (node instanceof Primitive) {
            if (!this.ctx.isType || this.ctx.inTraitList) {
                // don't add primitive types for non-type or trait completion
                return true
            }

            this.addItem({
                label: name,
                kind: CompletionItemKind.Property,
                insertText: name,
                insertTextFormat: InsertTextFormat.Snippet,
                sortText: `0${name}`,
            })
        } else if (node instanceof Constant) {
            if (this.ctx.isType) {
                // don't add constants for type completion
                return true
            }

            // don't add `self.` prefix for global constants
            const thisPrefix = prefix !== "" && node.owner() === null ? "" : prefix

            const typeNode = node.typeNode()
            const value = node.value()
            const valueType = typeNode?.type()?.qualifiedName() ?? ""
            this.addItem({
                label: thisPrefix + name,
                kind: CompletionItemKind.Constant,
                labelDetails: {
                    detail: ": " + valueType + " = " + (value?.node?.text ?? "unknown"),
                },
                insertText: thisPrefix + name,
                insertTextFormat: InsertTextFormat.Snippet,
                sortText: `3${name}`,
            })
        } else if (node instanceof Field) {
            if (this.ctx.isType) {
                // don't add fields for type completion
                return true
            }

            // don't add `self.` for completion of field in init
            const thisPrefix = this.ctx.inNameOfFieldInit ? "" : prefix
            const comma = this.ctx.inMultilineStructInit ? "," : ""
            const suffix = this.ctx.inNameOfFieldInit ? `: $1${comma}$0` : ""

            const typeNode = node.typeNode()
            const valueType = typeNode?.type()?.qualifiedName() ?? ""
            this.addItem({
                label: thisPrefix + name,
                kind: CompletionItemKind.Property,
                labelDetails: {
                    detail: ": " + valueType,
                },
                insertText: thisPrefix + name + suffix,
                insertTextFormat: InsertTextFormat.Snippet,
                sortText: `2${name}`,
            })
        } else if (node.node.type === "identifier") {
            if (this.ctx.isType) {
                // don't add variables for type completion
                return true
            }

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
                        detail: ": " + (type?.qualifiedName() ?? "unknown"),
                    },
                    insertText: name,
                    insertTextFormat: InsertTextFormat.Snippet,
                    sortText: `3${name}`,
                })
            }
        } else if (node.node.type === "parameter") {
            if (this.ctx.isType) {
                // don't add parameters for type completion
                return true
            }

            const parent = node.node.parent
            if (!parent) return true

            const type = TypeInferer.inferType(node)

            this.addItem({
                label: name,
                kind: CompletionItemKind.Variable,
                labelDetails: {
                    detail: ": " + (type?.qualifiedName() ?? "unknown"),
                },
                insertText: name,
                insertTextFormat: InsertTextFormat.Snippet,
                sortText: `3${name}`,
            })
        } else {
            this.addItem({
                label: name,
                sortText: `${name}-1`,
            })
        }

        return true
    }

    public addItem(node: CompletionItem) {
        if (this.result.has(node.label) || node.label === "") return
        this.result.set(node.label, node)
    }
}
