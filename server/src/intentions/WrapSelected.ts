//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type {Intention, IntentionContext} from "@server/intentions/Intention"
import type {WorkspaceEdit} from "vscode-languageserver"
import {FileDiff} from "@server/utils/FileDiff"
import type {Node as SyntaxNode} from "web-tree-sitter"
import {RecursiveVisitor} from "@server/psi/visitor"

export class WrapSelected implements Intention {
    public readonly id: string
    public readonly name: string
    public readonly snippet: string

    private readonly statementsWithSemicolon: string[] = [
        "let_statement",
        "return_statement",
        "expression_statement",
        "assignment_statement",
        "augmented_assignment_statement",
        "do_until_statement",
    ]

    private readonly statementTypes: string[] = [
        ...this.statementsWithSemicolon,

        "block_statement",
        "if_statement",
        "while_statement",
        "repeat_statement",
        "try_statement",
        "foreach_statement",
    ]

    public constructor(to: string, snippet: string) {
        this.id = `tact.wrap-selected-${to}`
        this.name = `Wrap selected to "${to}"`
        this.snippet = snippet
    }

    public findStatements(ctx: IntentionContext): SyntaxNode[] {
        if (ctx.noSelection) return []

        const statements: SyntaxNode[] = []
        const startLine = ctx.range.start.line
        const endLine = ctx.range.end.line

        // Find all top-level statements in selection
        RecursiveVisitor.visit(ctx.file.rootNode, (node): boolean => {
            if (!this.statementTypes.includes(node.type)) return true

            const nodeStartLine = node.startPosition.row
            const nodeEndLine = node.endPosition.row

            // Check if node is within selection
            if (nodeStartLine >= startLine && nodeEndLine <= endLine) {
                // Check if node's parent is not a statement or is outside selection
                const parent = node.parent
                if (
                    !parent ||
                    !this.statementTypes.includes(parent.type) ||
                    parent.startPosition.row < startLine ||
                    parent.endPosition.row > endLine
                ) {
                    statements.push(node)
                    // Skip visiting children since we don't want nested statements
                    return false
                }
            }
            return true
        })

        return statements.filter(statement => !this.statementTypes.includes(statement.text))
    }

    public isAvailable(ctx: IntentionContext): boolean {
        return this.findStatements(ctx).length > 0
    }

    private static findIndent(ctx: IntentionContext, node: SyntaxNode): number {
        const lines = ctx.file.content.split(/\r?\n/)
        const line = lines[node.startPosition.row]
        const lineTrim = line.trimStart()
        return line.indexOf(lineTrim)
    }

    private indentStatement(stmt: SyntaxNode, baseIndent: string): string {
        const needSemicolon = this.statementsWithSemicolon.includes(stmt.type)
        const lines = stmt.text.split("\n")
        if (lines.length === 1) {
            if (needSemicolon) {
                return baseIndent + stmt.text + ";"
            }

            return baseIndent + stmt.text
        }

        return lines
            .map((line, i) => {
                if (i === 0) return baseIndent + line
                if (i === lines.length - 1 && needSemicolon) return "    " + line + ";"
                return "    " + line
            })
            .join("\n")
    }

    public invoke(ctx: IntentionContext): WorkspaceEdit | null {
        const statements = this.findStatements(ctx)
        if (statements.length === 0) return null

        const diff = FileDiff.forFile(ctx.file.uri)
        const firstStmt = statements[0]
        const lastStmt = statements.at(-1)
        if (!lastStmt) return null

        const indentCount = WrapSelected.findIndent(ctx, firstStmt)
        const indent = " ".repeat(indentCount)

        const statementsText = statements
            .map((stmt, i) => {
                if (i === 0) return this.indentStatement(stmt, "")
                return this.indentStatement(stmt, indent + "    ")
            })
            .join("\n")

        const result = this.snippet
            .trimStart()
            .replace(/\$stmts/, statementsText)
            .replace(/\$indent/g, indent)

        diff.replace(
            {
                start: {
                    line: firstStmt.startPosition.row,
                    character: firstStmt.startPosition.column,
                },
                end: {
                    line: lastStmt.endPosition.row,
                    character: lastStmt.endPosition.column + 1,
                },
            },
            result,
        )

        return diff.toWorkspaceEdit()
    }
}

export class WrapSelectedToTry extends WrapSelected {
    public constructor() {
        super(
            "try",
            `
try {
    $indent$stmts
$indent}`,
        )
    }
}

export class WrapSelectedToTryCatch extends WrapSelected {
    public constructor() {
        super(
            "try-catch",
            `
try {
    $indent$stmts
$indent} catch(e) {

$indent}`,
        )
    }
}

export class WrapSelectedToRepeat extends WrapSelected {
    public constructor() {
        super(
            "repeat",
            `
repeat(10) {
    $indent$stmts
$indent}`,
        )
    }
}
