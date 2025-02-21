import {Position} from "vscode-languageclient"
import type {Node as SyntaxNode, Parser} from "web-tree-sitter"
import {parse} from "@textlint/markdown-to-ast"
import * as lsp from "vscode-languageserver"
import {RecursiveVisitor} from "@server/psi/visitor"
import {Tokens} from "@server/semantic_tokens/tokens"

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
}

function processNode(
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

export function processDocComment(
    tokens: Tokens,
    comment: {
        lines: string[]
        startPosition: Position
    },
    parser: Parser,
): void {
    const ast = parse(comment.lines.join("\n"))
    ast.children.forEach(node => {
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

        if (node.type !== "CodeBlock") return
        if (node.lang !== "tact") return

        const tree = parser.parse(node.value)
        if (!tree) {
            console.error("cannot parse code from doc comment:")
            console.error("comment:", node.value)
            console.error("position:", node.loc)
            return
        }

        const shift = {
            line: node.loc.start.line + comment.startPosition.line,
            character: node.loc.start.column + comment.startPosition.character + 4,
        }

        RecursiveVisitor.visit(tree.rootNode, (n): boolean => processNode(n, tokens, shift))
    })
}
