import {ScopeProcessor} from "../psi/Reference";
import {NamedNode, Node} from "../psi/Node";
import {Constant, Function, Message, Primitive, Struct} from "../psi/TopLevelDeclarations";
import {CompletionItem, InsertTextFormat, CompletionItemKind} from "vscode-languageserver-types";
import {TypeInferer} from "../TypeInferer";
import {CompletionContext} from "./CompletionContext";

export class ReferenceCompletionProcessor implements ScopeProcessor {
    constructor(private ctx: CompletionContext) {
    }

    public result: Map<string, CompletionItem> = new Map();

    public execute(node: Node): boolean {
        if (!(node instanceof NamedNode)) return true

        const name = node.name()
        if (name.endsWith('dummyIdentifier')) return true

        if (node instanceof Function) {
            if (this.ctx.isType) {
                // don't add functions for type completion
                return true
            }

            const signature = node.signatureText()
            const hasNoParams = node.parameters().length == 0 || (node.withSelf() && node.parameters().length == 1)

            const needSemicolon = this.ctx.isExpression

            // TODO: check for `;` existence
            // We want to place cursor in parens only if there are any parameters to write.
            const insertText = name + (hasNoParams ? '()' : '($1)') + (needSemicolon ? '$2;$0' : '')

            this.addItem({
                label: name,
                kind: CompletionItemKind.Function,
                labelDetails: {
                    detail: signature,
                },
                documentation: `fn ${name}${signature}`,
                insertText: insertText,
                insertTextFormat: InsertTextFormat.Snippet,
                sortText: `1${name}`
            })
        } else if (node instanceof Struct || node instanceof Message) {
            // we don't want to add `{}` for type completion
            const braces = this.ctx.isType ? "" : "{$1}"

            this.addItem({
                label: name,
                kind: CompletionItemKind.Struct,
                insertText: `${name}${braces}$0`,
                insertTextFormat: InsertTextFormat.Snippet,
                sortText: `2${name}`
            })
        } else if (node instanceof Primitive) {
            this.addItem({
                label: name,
                kind: CompletionItemKind.Property,
                insertText: name,
                insertTextFormat: InsertTextFormat.Snippet,
                sortText: `0${name}`
            })
        } else if (node instanceof Constant) {
            if (this.ctx.isType) {
                // don't add constants for type completion
                return true
            }

            const typeNode = node.typeNode()
            const value = node.value()
            const valueType = typeNode?.type()?.qualifiedName() ?? ''
            this.addItem({
                label: name,
                kind: CompletionItemKind.Constant,
                labelDetails: {
                    detail: ': ' + valueType + ' = ' + (value?.node?.text ?? "unknown"),
                },
                insertText: name,
                insertTextFormat: InsertTextFormat.Snippet,
                sortText: `2${name}`
            })
        } else if (node.node.type === 'identifier') {
            if (this.ctx.isType) {
                // don't add variables for type completion
                return true
            }

            const parent = node.node.parent
            if (!parent) return true

            if (parent.type === 'let_statement' ||
                parent.type === 'foreach_statement' ||
                parent.type === 'catch_clause') {
                const type = TypeInferer.inferType(node)

                this.addItem({
                    label: name,
                    kind: CompletionItemKind.Variable,
                    labelDetails: {
                        detail: ': ' + (type?.qualifiedName() ?? "unknown"),
                    },
                    insertText: name,
                    insertTextFormat: InsertTextFormat.Snippet,
                    sortText: `3${name}`
                })
            }
        } else if (node.node.type === 'parameter') {
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
                    detail: ': ' + (type?.qualifiedName() ?? "unknown"),
                },
                insertText: name,
                insertTextFormat: InsertTextFormat.Snippet,
                sortText: `3${name}`
            })
        } else {
            this.addItem({
                label: name,
                sortText: `${name}-1`
            })
        }

        return true
    }

    public addItem(node: CompletionItem) {
        if (node.label in this.result || node.label === '') return
        this.result.set(node.label, node)
    }
}
