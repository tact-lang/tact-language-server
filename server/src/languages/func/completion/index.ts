import * as lsp from "vscode-languageserver"
import {getOffsetFromPosition} from "@server/document-store"
import {asParserPoint} from "@server/utils/position"
import {FuncFile} from "@server/languages/func/psi/FuncFile"
import {createFuncParser} from "@server/parser"
import {FuncNamedNode, FuncNode} from "@server/languages/func/psi/FuncNode"
import {FuncReference, FuncScopeProcessor} from "@server/languages/func/psi/FuncReference"
import {
    FuncFunction,
    FuncGlobalVariable,
    FuncConstant,
    FuncParameter,
    FuncVariable,
} from "@server/languages/func/psi/FuncDecls"
import {FUNC_METHOD_RETURN_TYPES} from "@server/languages/func/types/BaseTy"

export async function provideFuncCompletion(
    file: FuncFile,
    params: lsp.CompletionParams,
    uri: string,
): Promise<lsp.CompletionItem[]> {
    const content = file.content
    const parser = createFuncParser()

    const offset = getOffsetFromPosition(content, params.position.line, params.position.character)
    const start = content.slice(0, offset)
    const end = content.slice(offset)

    const newContent = `${start}DummyIdentifier${end}`
    const tree = parser.parse(newContent)
    if (!tree) return []

    const cursorPosition = asParserPoint(params.position)
    const cursorNode = tree.rootNode.descendantForPosition(cursorPosition)
    if (
        cursorNode === null ||
        (cursorNode.type !== "identifier" && cursorNode.type !== "function_name")
    ) {
        return []
    }

    const completions: lsp.CompletionItem[] = []

    // Check if we're in a method call context (after . or ~)
    const isMethodContext = isMethodCallContext(cursorNode, content, offset)

    if (isMethodContext) {
        // Add method completions
        const methodCompletions = getMethodCompletions(cursorNode, file)
        completions.push(...methodCompletions)
    } else {
        // Add built-in types
        const builtinTypes = ["int", "cell", "slice", "builder", "cont", "tuple", "var"]
        for (const type of builtinTypes) {
            completions.push({
                label: type,
                kind: lsp.CompletionItemKind.TypeParameter,
                detail: `Built-in type: ${type}`,
            })
        }

        // Add keywords
        const keywords = [
            "if",
            "ifnot",
            "else",
            "elseif",
            "elseifnot",
            "while",
            "until",
            "do",
            "repeat",
            "return",
            "try",
            "catch",
            "global",
            "const",
            "forall",
            "impure",
            "inline",
            "inline_ref",
            "method_id",
            "asm",
        ]
        for (const keyword of keywords) {
            completions.push({
                label: keyword,
                kind: lsp.CompletionItemKind.Keyword,
                detail: `Keyword: ${keyword}`,
            })
        }

        // Use FuncReference to collect available symbols
        const newFile = new FuncFile(uri, tree, newContent)
        const dummyNode = new FuncNamedNode(cursorNode, newFile)
        const reference = new FuncReference(dummyNode)

        const completionProcessor: FuncScopeProcessor = {
            execute(node: FuncNamedNode): boolean {
                if (node.name() === "DummyIdentifier") return true

                if (node instanceof FuncFunction) {
                    const returnType = node.returnType()
                    const returnTypeText = returnType ? returnType.text : "unknown"
                    completions.push({
                        label: node.name(),
                        kind: lsp.CompletionItemKind.Function,
                        detail: `Function → ${returnTypeText}`,
                        documentation: "Function definition",
                    })
                } else if (node instanceof FuncParameter) {
                    const typeNode = node.typeNode()
                    const typeText = typeNode ? typeNode.text : "auto"
                    completions.push({
                        label: node.name(),
                        kind: lsp.CompletionItemKind.Variable,
                        detail: `Parameter: ${typeText}`,
                        documentation: "Function parameter",
                    })
                } else if (node instanceof FuncVariable) {
                    completions.push({
                        label: node.name(),
                        kind: lsp.CompletionItemKind.Variable,
                        detail: "Local variable",
                        documentation: "Local variable in current scope",
                    })
                } else if (node instanceof FuncGlobalVariable) {
                    const typeNode = node.typeNode()
                    const typeText = typeNode ? typeNode.text : "auto"
                    completions.push({
                        label: node.name(),
                        kind: lsp.CompletionItemKind.Variable,
                        detail: `Global variable: ${typeText}`,
                        documentation: "Global variable",
                    })
                } else if (node instanceof FuncConstant) {
                    const typeNode = node.typeNode()
                    const valueNode = node.valueNode()
                    const typeText = typeNode ? typeNode.text : "auto"
                    const valueText = valueNode ? valueNode.text : "unknown"
                    completions.push({
                        label: node.name(),
                        kind: lsp.CompletionItemKind.Constant,
                        detail: `Constant: ${typeText} = ${valueText}`,
                        documentation: "Constant definition",
                    })
                } else {
                    completions.push({
                        label: node.name(),
                        kind: lsp.CompletionItemKind.Variable,
                        detail: "Variable",
                        documentation: "Variable",
                    })
                }

                return true
            },
        }

        reference.processResolveVariants(completionProcessor)
    }

    // Remove duplicates and sort by relevance
    const uniqueCompletions = completions.filter(
        (completion, index, self) =>
            index ===
            self.findIndex(c => c.label === completion.label && c.kind === completion.kind),
    )

    // Sort by relevance: local variables first, then parameters, then functions, then globals
    uniqueCompletions.sort((a, b) => {
        const getRelevanceScore = (item: lsp.CompletionItem): number => {
            if (item.kind === lsp.CompletionItemKind.Method) return 0
            if (item.detail?.includes("Local variable")) return 1
            if (item.detail?.includes("Parameter")) return 2
            if (item.kind === lsp.CompletionItemKind.Function) return 3
            if (item.detail?.includes("Global variable")) return 4
            if (item.detail?.includes("Constant")) return 5
            if (item.kind === lsp.CompletionItemKind.Keyword) return 6
            if (item.kind === lsp.CompletionItemKind.TypeParameter) return 7
            return 8
        }

        const scoreA = getRelevanceScore(a)
        const scoreB = getRelevanceScore(b)

        if (scoreA !== scoreB) {
            return scoreA - scoreB
        }

        return a.label.localeCompare(b.label)
    })

    return uniqueCompletions
}

function isMethodCallContext(cursorNode: any, content: string, offset: number): boolean {
    // Look backwards to find . or ~ before the cursor position
    let checkOffset = offset - 1
    while (checkOffset >= 0 && /\s/.test(content[checkOffset])) {
        checkOffset-- // Skip whitespace
    }

    if (checkOffset >= 0 && (content[checkOffset] === "." || content[checkOffset] === "~")) {
        return true
    }

    return false
}

function getMethodCompletions(cursorNode: any, file: FuncFile): lsp.CompletionItem[] {
    const completions: lsp.CompletionItem[] = []

    // Find the object before the method call
    const objectNode = cursorNode.parent?.parent?.parent // Go up to find the object
    if (!objectNode) return completions

    // Try to infer the type of the object
    const objectType = inferObjectType(objectNode, file)
    if (!objectType) return completions

    // Get method completions for this type
    const methods = FUNC_METHOD_RETURN_TYPES[objectType]
    if (methods) {
        for (const [methodName, returnType] of Object.entries(methods)) {
            completions.push({
                label: methodName,
                kind: lsp.CompletionItemKind.Method,
                detail: `${objectType}.${methodName}() → ${returnType}`,
                documentation: `Method of ${objectType} type that returns ${returnType}`,
                insertText: methodName + "()",
                insertTextFormat: lsp.InsertTextFormat.Snippet,
            })
        }
    }

    // Add common modifying methods (that use ~ operator)
    const modifyingMethods = [
        "load_uint",
        "load_int",
        "load_coins",
        "load_ref",
        "skip_bits",
        "store_uint",
        "store_int",
        "store_coins",
        "store_ref",
        "store_slice",
    ]

    for (const method of modifyingMethods) {
        if (objectType === "slice" && method.startsWith("load_")) {
            completions.push({
                label: `~${method}`,
                kind: lsp.CompletionItemKind.Method,
                detail: `${objectType}.~${method}() → (${objectType}, result)`,
                documentation: `Modifying method that updates the ${objectType} and returns the result`,
                insertText: `~${method}()`,
                insertTextFormat: lsp.InsertTextFormat.Snippet,
            })
        } else if (objectType === "builder" && method.startsWith("store_")) {
            completions.push({
                label: `~${method}`,
                kind: lsp.CompletionItemKind.Method,
                detail: `${objectType}.~${method}() → ${objectType}`,
                documentation: `Modifying method that updates the ${objectType}`,
                insertText: `~${method}()`,
                insertTextFormat: lsp.InsertTextFormat.Snippet,
            })
        }
    }

    return completions
}

function inferObjectType(objectNode: any, file: FuncFile): string | null {
    try {
        const funcNode = new FuncNode(objectNode, file)
        const type = funcNode.type()
        return type ? type.name() : null
    } catch {
        return null
    }
}
