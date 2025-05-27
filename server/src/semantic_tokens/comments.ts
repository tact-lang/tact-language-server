//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import {Position} from "vscode-languageclient"
import type {Node as SyntaxNode, Parser} from "web-tree-sitter"
import {parse} from "@textlint/markdown-to-ast"
import {TxtCodeBlockNode} from "@textlint/ast-node-types"
import * as lsp from "vscode-languageserver"
import {RecursiveVisitor} from "@server/psi/visitor"
import {Tokens} from "@server/semantic_tokens/tokens"
import {SemanticTokenTypes} from "vscode-languageserver-protocol"

const KEYWORDS = {
    extend: true,
    public: true,
    fun: true,
    let: true,
    return: true,
    receive: true,
    native: true,
    primitive: true,
    null: true,
    if: true,
    else: true,
    while: true,
    repeat: true,
    do: true,
    until: true,
    try: true,
    catch: true,
    foreach: true,
    as: true,
    map: true,
    mutates: true,
    extends: true,
    external: true,
    import: true,
    with: true,
    trait: true,
    initOf: true,
    override: true,
    abstract: true,
    virtual: true,
    inline: true,
    const: true,
    true: true,
    false: true,
    init: true,
    contract: true,
    message: true,
    struct: true,
}

const PUNCTUATION = {
    "(": true,
    ")": true,
    "{": true,
    "}": true,
    "[": true,
    "]": true,
    "<": true,
    ">": true,
    ":": true,
    ";": true,
    ",": true,
    ".": true,
    "=": true,
    "==": true,
    "!=": true,
    ">=": true,
    "<=": true,
    "+": true,
    "-": true,
    "/": true,
    "*": true,
    "%": true,
    "!": true,
    "!!": true,
    "&": true,
    "|": true,
    "&&": true,
    "||": true,
    "?": true,
    "^": true,
    "#<=": true,
    "#<": true,
}

function processTactNode(
    n: SyntaxNode,
    tokens: Tokens,
    shift: {
        line: number
        character: number
    },
): boolean {
    if (n.text in KEYWORDS) {
        tokens.node(n, lsp.SemanticTokenTypes.keyword, shift)
        return true
    }
    if (n.type in PUNCTUATION) {
        tokens.node(n, lsp.SemanticTokenTypes.operator, shift)
        return true
    }

    switch (n.type) {
        case "integer": {
            tokens.node(n, lsp.SemanticTokenTypes.number, shift)
            break
        }
        case "boolean":
        case "null":
        case "self": {
            tokens.node(n, lsp.SemanticTokenTypes.keyword, shift)
            break
        }
        case "string": {
            tokens.node(n, lsp.SemanticTokenTypes.string, shift)
            break
        }
        case "type_identifier": {
            tokens.node(n, lsp.SemanticTokenTypes.type, shift)
            break
        }
        case "global_function": {
            const name = n.childForFieldName("name")
            if (!name) return true
            tokens.node(name, lsp.SemanticTokenTypes.function, shift)
            break
        }
        case "static_call_expression": {
            const name = n.childForFieldName("name")
            if (!name) return true
            tokens.node(name, lsp.SemanticTokenTypes.function, shift)
            break
        }
        case "method_call_expression": {
            const name = n.childForFieldName("name")
            if (!name) return true
            tokens.node(name, lsp.SemanticTokenTypes.function, shift)
            break
        }
        case "field_access_expression": {
            const name = n.childForFieldName("name")
            if (!name) return true
            tokens.node(name, lsp.SemanticTokenTypes.property, shift)
            break
        }
        case "let_statement": {
            const name = n.childForFieldName("name")
            if (!name) return true
            tokens.node(name, lsp.SemanticTokenTypes.variable, shift)
            break
        }
        case "identifier": {
            tokens.node(n, lsp.SemanticTokenTypes.variable, shift)
            break
        }
    }
    return true
}

function processTlbNode(
    n: SyntaxNode,
    tokens: Tokens,
    shift: {
        line: number
        character: number
    },
): boolean {
    if (n.type in PUNCTUATION) {
        tokens.node(n, lsp.SemanticTokenTypes.operator, shift)
        return true
    }

    switch (n.type) {
        case "##": {
            tokens.node(n, lsp.SemanticTokenTypes.macro, shift)
            break
        }
        case "number":
        case "hex": {
            tokens.node(n, lsp.SemanticTokenTypes.number, shift)
            break
        }
        case "constructor_tag": {
            tokens.node(n, lsp.SemanticTokenTypes.number, shift)
            break
        }
        case "identifier": {
            const parent = n.parent
            if (!parent) return true
            if (parent.type === "field_named") {
                tokens.node(n, lsp.SemanticTokenTypes.property, shift)
                break
            }
            tokens.node(n, lsp.SemanticTokenTypes.number, shift)
            break
        }
        case "type_identifier": {
            const parent = n.parent
            if (!parent) break

            if (parent.type === "combinator" || parent.type === "combinator_expr") {
                tokens.node(n, SemanticTokenTypes.class, shift)
                break
            }

            tokens.node(n, SemanticTokenTypes.type, shift)
            break
        }
        case "field_named": {
            const identifier = n.firstNamedChild
            if (!identifier) break
            tokens.node(identifier, SemanticTokenTypes.property, shift)
            break
        }
        case "constructor_": {
            const identifier = n.firstNamedChild
            if (identifier && identifier.type === "identifier") {
                tokens.node(identifier, SemanticTokenTypes.type, shift)
            }
            break
        }
        case "combinator": {
            break
        }
        case "builtin_field": {
            tokens.node(n, SemanticTokenTypes.property, shift)
            break
        }
    }
    return true
}

export function processDocComment(
    tokens: Tokens,
    comment: {
        lines: string[]
        startPosition: Position
    },
    parser: Parser,
    tlbParser: Parser,
): void {
    const ast = parse(comment.lines.join("\n"))
    for (const node of ast.children) {
        if (node.type === "Paragraph") {
            node.children.forEach(child => {
                if (child.type === "Code") {
                    tokens.push(
                        {
                            line: comment.startPosition.line + child.loc.start.line - 1,
                            character: comment.startPosition.character + 4 + child.loc.start.column,
                        },
                        child.loc.end.column - child.loc.start.column,
                        lsp.SemanticTokenTypes.variable,
                    )
                    return
                }
                if (child.type === "Strong") {
                    tokens.push(
                        {
                            line: comment.startPosition.line + child.loc.start.line - 1,
                            character: comment.startPosition.character + 4 + child.loc.start.column,
                        },
                        child.loc.end.column - child.loc.start.column,
                        lsp.SemanticTokenTypes.operator,
                    )
                    return
                }
            })
        }

        if (node.type !== "CodeBlock") continue

        if (node.lang === "tact") {
            const tree = parser.parse(node.value)
            if (!tree) {
                cannotParseCommentError(node)
                continue
            }

            const shift = {
                line: node.loc.start.line + comment.startPosition.line,
                character: node.loc.start.column + comment.startPosition.character + 4,
            }

            RecursiveVisitor.visit(tree.rootNode, (n): boolean => processTactNode(n, tokens, shift))
        }

        if (
            node.lang === "tlb" ||
            node.lang === "tl-b" ||
            node.lang === "TL-B" ||
            node.lang === "TL-b"
        ) {
            const tree = tlbParser.parse(node.value)
            if (!tree) {
                cannotParseCommentError(node)
                continue
            }

            const shift = {
                line: node.loc.start.line + comment.startPosition.line,
                character: node.loc.start.column + comment.startPosition.character + 4,
            }

            RecursiveVisitor.visit(tree.rootNode, (n): boolean => processTlbNode(n, tokens, shift))
        }
    }
}

function cannotParseCommentError(node: TxtCodeBlockNode): void {
    console.error("cannot parse code from doc comment:")
    console.error("comment:", node.value)
    console.error("position:", node.loc)
}
