//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type {Node as SyntaxNode} from "web-tree-sitter"
import {TactFile} from "./TactFile"
import {Ty} from "@server/languages/tact/types/BaseTy"
import {TypeInferer} from "@server/languages/tact/TypeInferer"
import {Range} from "vscode-languageserver-textdocument"
import {AsmInstruction, findInstruction} from "@server/languages/tact/completion/data/types"
import {Position} from "vscode-languageclient"
import {trimPrefix} from "@server/utils/strings"
import {asLspPosition} from "@server/utils/position"
import {BaseNode} from "@server/psi/BaseNode"

export class TactNode extends BaseNode {
    public node: SyntaxNode
    public file: TactFile

    public constructor(node: SyntaxNode, file: TactFile) {
        super()
        this.node = node
        this.file = file
    }
}

export class Expression extends TactNode {
    public type(): Ty | null {
        return TypeInferer.inferType(this)
    }
}

export class NamedNode extends TactNode {
    public static create(node: SyntaxNode, file: TactFile): NamedNode {
        return new NamedNode(node, file)
    }

    public nameIdentifier(): SyntaxNode | null {
        if (
            this.node.type === "identifier" ||
            this.node.type === "self" ||
            this.node.type === "type_identifier"
        ) {
            return this.node
        }

        if (this.node.type === "primitive") {
            const nameNode = this.node.childForFieldName("type")
            if (!nameNode) {
                return null
            }
            return nameNode
        }

        const nameNode = this.node.childForFieldName("name")
        if (!nameNode) {
            return null
        }
        return nameNode
    }

    public nameNode(): NamedNode | null {
        const node = this.nameIdentifier()
        if (!node) return null
        return new NamedNode(node, this.file)
    }

    public name(): string {
        const ident = this.nameIdentifier()
        if (ident === null) return ""
        return ident.text
    }

    public defaultValue(): Expression | null {
        const valueNode = this.node.childForFieldName("value")
        if (valueNode === null) return null
        return new Expression(valueNode, this.file)
    }

    public defaultValueRange(): Range | null {
        const valueNode = this.node.childForFieldName("value")
        if (valueNode === null) return null
        const typeNode = this.node.childForFieldName("type")
        if (typeNode === null) return null

        return {
            start: {
                line: typeNode.endPosition.row,
                character: typeNode.endPosition.column,
            },
            end: {
                line: valueNode.endPosition.row,
                character: valueNode.endPosition.column,
            },
        }
    }

    public documentation(): string {
        return extractCommentsDoc(this.node)
    }

    public isDeprecatedNoIndex(): boolean {
        const doc = this.documentation()
        return doc.includes("Deprecated")
    }
}

export function extractCommentsDocContent(node: SyntaxNode): {
    lines: string[]
    startPosition: Position
} | null {
    const prevSibling = node.previousSibling
    if (!prevSibling || prevSibling.type !== "comment") return null

    const nodeStartLine = node.startPosition.row

    const comments: SyntaxNode[] = []
    let comment: SyntaxNode | null = prevSibling
    while (comment?.type === "comment") {
        const commentStartLine = comment.startPosition.row

        if (commentStartLine + 1 + comments.length != nodeStartLine) {
            break
        }

        // possibly inline comment
        const prev = comment.previousSibling
        if (prev?.endPosition.row === commentStartLine) {
            // same line with the previous node, inline comment
            break
        }

        comments.push(comment)
        comment = comment.previousSibling
    }

    if (comments.length === 0) return null

    const finalComments = comments.reverse()

    return {
        lines: finalComments.map(c =>
            trimPrefix(trimPrefix(trimPrefix(c.text, "///"), "//"), " ").trimEnd(),
        ),
        startPosition: asLspPosition(comments[0].startPosition),
    }
}

export function extractCommentsDoc(node: SyntaxNode): string {
    const content = extractCommentsDocContent(node)
    if (!content) return ""
    return content.lines.join("\n")
}

export class VarDeclaration extends NamedNode {
    public typeHint(): Expression | null {
        const node = this.node.childForFieldName("type")
        if (!node) return null
        return new Expression(node, this.file)
    }

    public hasTypeHint(): boolean {
        const node = this.node.childForFieldName("type")
        return node !== null
    }

    public value(): Expression | null {
        const node = this.node.childForFieldName("value")
        if (!node) return null
        return new Expression(node, this.file)
    }

    public type(): Ty | null {
        const hint = this.typeHint()
        if (hint !== null) {
            return hint.type()
        }

        const value = this.value()
        if (value !== null) {
            return value.type()
        }

        return null
    }
}

export class CallLike extends NamedNode {
    public rawArguments(): SyntaxNode[] {
        const node = this.node.childForFieldName("arguments")
        if (!node) return []
        return node.children.filter(it => it !== null)
    }

    public arguments(): SyntaxNode[] {
        return this.rawArguments().filter(it => it.type === "argument")
    }
}

export class AsmInstr extends NamedNode {
    public arguments(): SyntaxNode[] {
        const argsList = this.node.childForFieldName("arguments")
        if (!argsList) return []
        return argsList.children.filter(it => it !== null)
    }

    public async info(): Promise<AsmInstruction | null> {
        return findInstruction(this.name(), this.arguments())
    }
}
