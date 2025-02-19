import {RecursiveVisitor} from "@server/psi/visitor"
import type {File} from "@server/psi/File"
import {Reference} from "@server/psi/Reference"
import type {Node as SyntaxNode, Parser} from "web-tree-sitter"
import {NamedNode, Node} from "@server/psi/Node"
import * as lsp from "vscode-languageserver"
import type {SemanticTokens} from "vscode-languageserver"
import {isNamedFunNode, measureTime} from "@server/psi/utils"
import * as marked from "marked"
import {render} from "@croct/md-lite"
import {parse} from "@textlint/markdown-to-ast"
import {Fun} from "@server/psi/Decls"
import {trimPrefix} from "@server/utils/strings"
import {createTactParser} from "@server/parser"
import {Position} from "vscode-languageclient"
import {asLspPosition} from "@server/utils/position"
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
}

const OPERATORS = {
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
    "&": true,
    "|": true,
    "&&": true,
    "||": true,
}

function processDocComment(
    comment: {
        content: string
        startPosition: Position
    },
    parser: Parser,
    pushToken2: (
        absLine: number,
        absCol: number,
        n: SyntaxNode,
        tokenType: SemanticTokenTypes,
    ) => void,
    pushToken3: (
        absLine: number,
        absCol: number,
        len: number,
        tokenType: SemanticTokenTypes,
    ) => void,
) {
    const ast = parse(comment.content)
    ast.children.forEach(node => {
        if (node.type === "Paragraph") {
            node.children.forEach(child => {
                if (child.type === "Code") {
                    pushToken3(
                        comment.startPosition.line + child.loc.start.line - 1,
                        comment.startPosition.character + 4 + child.loc.start.column,
                        child.loc.end.column - child.loc.start.column,
                        lsp.SemanticTokenTypes.variable,
                    )
                    return
                }
                if (child.type === "Strong") {
                    pushToken3(
                        comment.startPosition.line + child.loc.start.line - 1,
                        comment.startPosition.character + 4 + child.loc.start.column,
                        child.loc.end.column - child.loc.start.column,
                        lsp.SemanticTokenTypes.operator,
                    )
                    return
                }
            })
        }

        if (node.type !== "CodeBlock") return
        if (node.lang !== "tact") return

        const absLine = node.loc.start.line + comment.startPosition.line
        const absCol = node.loc.start.column + comment.startPosition.character + 4

        const content = node.value
        const root = parser.parse(content)!.rootNode

        RecursiveVisitor.visit(root, (n): boolean => {
            if (n.text in KEYWORDS) {
                pushToken2(absLine, absCol, n, lsp.SemanticTokenTypes.keyword)
                return true
            }
            if (n.type in OPERATORS) {
                pushToken2(absLine, absCol, n, lsp.SemanticTokenTypes.operator)
                return true
            }
            if (n.type === "integer") {
                pushToken2(absLine, absCol, n, lsp.SemanticTokenTypes.number)
                return true
            }
            if (n.type === "string") {
                pushToken2(absLine, absCol, n, lsp.SemanticTokenTypes.string)
                return true
            }
            if (n.type === "type_identifier") {
                pushToken2(absLine, absCol, n, lsp.SemanticTokenTypes.type)
                return true
            }
            if (n.type === "global_function") {
                const name = n.childForFieldName("name")
                if (!name) return true
                pushToken2(absLine, absCol, name, lsp.SemanticTokenTypes.function)
                return true
            }
            if (n.type === "static_call_expression") {
                const name = n.childForFieldName("name")
                if (!name) return true
                pushToken2(absLine, absCol, name, lsp.SemanticTokenTypes.function)
                return true
            }
            if (n.type === "method_call_expression") {
                const name = n.childForFieldName("name")
                if (!name) return true
                pushToken2(absLine, absCol, name, lsp.SemanticTokenTypes.function)
                return true
            }
            if (n.type === "field_access_expression") {
                const name = n.childForFieldName("name")
                if (!name) return true
                pushToken2(absLine, absCol, name, lsp.SemanticTokenTypes.property)
                return true
            }
            if (n.type === "let_statement") {
                const name = n.childForFieldName("name")
                if (!name) return true
                pushToken2(absLine, absCol, name, lsp.SemanticTokenTypes.variable)
                return true
            }
            if (n.type === "identifier") {
                pushToken2(absLine, absCol, n, lsp.SemanticTokenTypes.variable)
                return true
            }
            return true
        })
    })
}

export function collect(file: File): SemanticTokens {
    const tokens: SemanticToken[] = []

    const parser = createTactParser()

    function pushToken(n: SyntaxNode, tokenType: lsp.SemanticTokenTypes): void {
        tokens.push({
            line: n.startPosition.row,
            start: n.startPosition.column,
            len: n.endPosition.column - n.startPosition.column,
            typ: Object.keys(lsp.SemanticTokenTypes).indexOf(tokenType),
            mods: [],
        })
    }

    function pushToken2(
        absLine: number,
        absCol: number,
        n: SyntaxNode,
        tokenType: lsp.SemanticTokenTypes,
    ) {
        tokens.push({
            line: absLine + n.startPosition.row,
            start: absCol + n.startPosition.column,
            len: n.endPosition.column - n.startPosition.column,
            typ: Object.keys(lsp.SemanticTokenTypes).indexOf(tokenType),
            mods: [],
        })
    }

    function pushToken3(
        absLine: number,
        absCol: number,
        len: number,
        tokenType: lsp.SemanticTokenTypes,
    ) {
        tokens.push({
            line: absLine,
            start: absCol,
            len: len,
            typ: Object.keys(lsp.SemanticTokenTypes).indexOf(tokenType),
            mods: [],
        })
    }

    RecursiveVisitor.visit(file.rootNode, (n): boolean => {
        const type = n.type

        // asm fun foo() {}
        // ^^^ this
        if (type === "asm" && n.parent?.type === "asm_function") {
            pushToken(n, lsp.SemanticTokenTypes.keyword)
            return true
        }

        if (type === "global_constant") {
            const name = n.childForFieldName("name")
            if (!name) return true
            pushToken(name, lsp.SemanticTokenTypes.property)
            return true
        }

        if (type === "storage_function") {
            const name = n.childForFieldName("name")
            if (!name) return true
            pushToken(name, lsp.SemanticTokenTypes.function)
            return true
        }

        if (type === "parameter") {
            const name = n.childForFieldName("name")
            if (!name) return true
            pushToken(name, lsp.SemanticTokenTypes.parameter)
            return true
        }

        if (type === "let_statement") {
            const name = n.childForFieldName("name")
            if (!name) return true
            pushToken(name, lsp.SemanticTokenTypes.variable)
            return true
        }

        if (type === "field" || type === "storage_variable") {
            const name = n.childForFieldName("name")
            if (!name) return true
            pushToken(name, lsp.SemanticTokenTypes.property)
            return true
        }

        if (type === "constant" || type === "storage_constant") {
            const name = n.childForFieldName("name")
            if (!name) return true
            pushToken(name, lsp.SemanticTokenTypes.enumMember)
            return true
        }

        // asm fun foo() { ONE }
        //                 ^^^ this
        if (type === "tvm_instruction") {
            pushToken(n, lsp.SemanticTokenTypes.macro)
            return true
        }

        if (type === "asm_stack_register") {
            pushToken(n, lsp.SemanticTokenTypes.parameter)
            return true
        }

        if (type === "identifier") {
            const element = new NamedNode(n, file)
            const resolved = Reference.resolve(element)
            if (!resolved) return true
            const resolvedType = resolved.node.type

            switch (resolvedType) {
                case "parameter": {
                    pushToken(n, lsp.SemanticTokenTypes.parameter)
                    break
                }
                case "field":
                case "storage_variable": {
                    pushToken(n, lsp.SemanticTokenTypes.property)
                    break
                }
                case "constant":
                case "storage_constant": {
                    pushToken(n, lsp.SemanticTokenTypes.enumMember)
                    break
                }
                default: {
                    if (isNamedFunNode(resolved.node)) {
                        pushToken(n, lsp.SemanticTokenTypes.function)
                    } else if (resolved.node.parent?.type === "let_statement") {
                        pushToken(n, lsp.SemanticTokenTypes.variable)
                    }
                }
            }
        }

        if (type === "global_function" || type === "asm_function" || type === "native_function") {
            const fun = new Fun(n, file)

            const comment = extractCommentsDoc(fun)
            if (!comment) return true

            processDocComment(comment, parser, pushToken2, pushToken3)
        }

        return true
    })

    return {
        resultId: Date.now().toString(),
        data: encode(tokens),
    }
}

interface SemanticToken {
    line: number
    start: number
    len: number
    typ: number
    mods: string[]
}

// encode encodes an array of semantic tokens into an array of u32s.
// See https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#textDocument_semanticTokens
// for more information.
export function encode(tokens: SemanticToken[]): number[] {
    const result = [...tokens]

    // By specification, the tokens must be sorted.
    result.sort((left, right) => {
        if (left.line !== right.line) {
            return left.line - right.line
        }
        return left.start - right.start
    })

    const res: number[] = new Array(result.length * 5)
    let cur = 0
    let last: SemanticToken = {line: 0, start: 0, len: 0, typ: 0, mods: []}

    for (const tok of result) {
        const typ = tok.typ >>> 0
        if (cur === 0) {
            res[cur] = tok.line
        } else {
            res[cur] = tok.line - last.line
        }
        res[cur + 1] = tok.start
        if (cur > 0 && res[cur] === 0) {
            res[cur + 1] = tok.start - last.start
        }
        res[cur + 2] = tok.len
        res[cur + 3] = typ
        res[cur + 4] = tok.mods.includes("mutable")
            ? 0b010000000000
            : tok.mods.includes("global")
              ? 0b0100000000000
              : 0
        cur += 5
        last = tok
    }

    return res.slice(0, cur)
}

export function extractCommentsDoc(node: Node): {
    content: string
    startPosition: Position
} | null {
    const prevSibling = node.node.previousSibling
    if (!prevSibling || prevSibling.type !== "comment") return null

    const comments: SyntaxNode[] = []
    let comment: SyntaxNode | null = prevSibling
    while (comment?.type === "comment") {
        const nodeStartLine = node.node.startPosition.row
        const commentStartLine = comment.startPosition.row

        if (commentStartLine + 1 + comments.length != nodeStartLine) {
            break
        }

        comments.push(comment)
        comment = comment.previousSibling
    }

    const finalComments = comments.reverse()

    const content = finalComments
        .map(c => trimPrefix(trimPrefix(trimPrefix(c.text, "///"), "//"), " ").trimEnd())
        .join("\n")
    return {
        content,
        startPosition: asLspPosition(comments[0].startPosition),
    }
}
