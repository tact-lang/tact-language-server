import * as lsp from "vscode-languageserver"
import type {Node as SyntaxNode} from "web-tree-sitter"
import {TactFile} from "@server/languages/tact/psi/TactFile"
import {getDocumentSettings} from "@server/settings/settings"
import {
    generateAttributeKeywordDoc,
    generateKeywordDoc,
} from "@server/languages/tact/documentation/keywords_documentation"
import {asLspRange} from "@server/utils/position"
import {AsmInstr, NamedNode} from "@server/languages/tact/psi/TactNode"
import {generateAsmDoc} from "@server/languages/tact/documentation/asm_documentation"
import {generateTlBTypeDoc} from "@server/languages/tact/documentation/tlb_type_documentation"
import {InitFunction, MessageFunction} from "@server/languages/tact/psi/Decls"
import {
    generateInitDoc,
    generateReceiverDoc,
} from "@server/languages/tact/documentation/receivers_documentation"
import {generateExitCodeDocumentation} from "@server/languages/tact/documentation/exit_code_documentation"
import {Reference} from "@server/languages/tact/psi/Reference"
import * as docs from "@server/languages/tact/documentation/documentation"

export async function provideTactDocumentation(
    params: lsp.HoverParams,
    hoverNode: SyntaxNode,
    file: TactFile,
): Promise<lsp.Hover | null> {
    const settings = await getDocumentSettings(params.textDocument.uri)

    function isKeyword(node: SyntaxNode, text: string): boolean {
        return node.type === text && node.text === text
    }

    function generateKeywordMarkdownHoverDocFor(node: SyntaxNode): lsp.Hover | null {
        if (!settings.documentation.showKeywordDocumentation) {
            return null
        }
        const doc = generateKeywordDoc(node.text)
        if (doc === null) return null
        return {
            range: asLspRange(node),
            contents: {
                kind: "markdown",
                value: doc,
            },
        }
    }

    // Keyword hover docs, literally:
    // - initOf and codeOf
    // - null
    // - import
    // - primitive
    // - struct and message
    // - contract and trait

    if (
        isKeyword(hoverNode, "initOf") ||
        isKeyword(hoverNode, "codeOf") ||
        isKeyword(hoverNode, "null") ||
        isKeyword(hoverNode, "import") ||
        isKeyword(hoverNode, "primitive") ||
        isKeyword(hoverNode, "struct") ||
        isKeyword(hoverNode, "message") ||
        isKeyword(hoverNode, "contract") ||
        isKeyword(hoverNode, "trait")
    ) {
        return generateKeywordMarkdownHoverDocFor(hoverNode)
    }

    if (hoverNode.type === "tvm_instruction") {
        const asmExpression = hoverNode.parent
        if (!asmExpression) return null

        const instr = new AsmInstr(asmExpression, file)
        const info = instr.info()
        if (!info) return null

        const doc = generateAsmDoc(info)
        if (doc === null) return null

        return {
            range: asLspRange(hoverNode),
            contents: {
                kind: "markdown",
                value: doc,
            },
        }
    }

    const parent = hoverNode.parent
    if (parent?.type === "tlb_serialization") {
        const doc = generateTlBTypeDoc(hoverNode.text)
        if (doc === null) return null

        return {
            range: asLspRange(hoverNode),
            contents: {
                kind: "markdown",
                value: doc,
            },
        }
    }

    // TODO: Support @interface("...") attribute of contracts and traits elsewhere
    // See: https://docs.tact-lang.org/book/contracts/#interfaces
    //
    // if (parent?.type === "contract_attributes" &&
    //     hoverNode.type === "@interface") {
    //     // TODO: here we need to see whether the
    //     //       attribute is for the trait or for the contract
    //     const doc = generateAnnotationKeywordDoc(hoverNode.text, "contract" | "trait")
    //     if (doc === null) return null
    //     return mkMarkdownRangeDoc(doc, hoverNode)
    // }
    //
    // NOTE: perhaps, the following checks can be simplified and the checks for parent nodes
    //       can be removed for the majority of the following if clauses.

    // Keyword hover docs, with different type and text and/or other specifics:
    // - true and false (type "boolean")
    // - with (inside trait lists)
    // - const, several types of nodes: definitions and declarations
    // - constant attributes: virtual, override, abstract
    // - fun, several types of nodes: declarations and definitions
    // - native functions
    // - asm functions
    // - function attributes: virtual, override, abstract, get, extends, mutates, inline

    if (hoverNode.type === "boolean") {
        return generateKeywordMarkdownHoverDocFor(hoverNode)
    }

    if (parent?.type === "trait_list" && hoverNode.type === "with") {
        return generateKeywordMarkdownHoverDocFor(hoverNode)
    }

    if (
        hoverNode.type === "const" &&
        (parent?.type === "storage_constant" || parent?.type === "global_constant")
    ) {
        return generateKeywordMarkdownHoverDocFor(hoverNode)
    }

    if (parent?.type === "constant_attributes") {
        const doc = generateAttributeKeywordDoc(hoverNode.text, "const")
        if (doc === null) return null
        return {
            range: asLspRange(hoverNode),
            contents: {
                kind: "markdown",
                value: doc,
            },
        }
    }

    if (
        hoverNode.type === "fun" &&
        (parent?.type === "storage_function" ||
            parent?.type === "global_function" ||
            parent?.type === "asm_function")
    ) {
        return generateKeywordMarkdownHoverDocFor(hoverNode)
    }

    if (
        parent?.type === "function_attributes" ||
        (parent?.type === "get_attribute" && hoverNode.type === "get")
    ) {
        const doc = generateAttributeKeywordDoc(hoverNode.text, "fun")
        if (doc === null) return null
        return {
            range: asLspRange(hoverNode),
            contents: {
                kind: "markdown",
                value: doc,
            },
        }
    }

    if (parent?.type === "native_function" && hoverNode.type === "native") {
        return generateKeywordMarkdownHoverDocFor(hoverNode)
    }

    if (parent?.type === "name_attribute" && hoverNode.type === "@name") {
        return generateKeywordMarkdownHoverDocFor(hoverNode)
    }

    if (parent?.type === "asm_function" && hoverNode.type === "asm") {
        return generateKeywordMarkdownHoverDocFor(hoverNode)
    }

    if (parent?.type === "asm_arrangement_rets" && hoverNode.type === "->") {
        return generateKeywordMarkdownHoverDocFor(hoverNode)
    }

    // Keywords within statements:
    // - let statement, destructuring assignment let
    // - return statement
    // - branches: if...else, try...catch
    // - loops: repeat, while, do...until, foreach (and "in")

    if (parent?.type === "let_statement" && hoverNode.type === "let") {
        return generateKeywordMarkdownHoverDocFor(hoverNode)
    }

    if (parent?.type === "destruct_statement" && hoverNode.type === "let") {
        // A pseudo-keyword let_destruct just for the generateKeywordDoc()
        const doc = generateKeywordDoc("let_destruct")
        if (doc === null) return null
        return {
            range: asLspRange(hoverNode),
            contents: {
                kind: "markdown",
                value: doc,
            },
        }
    }

    if (
        isKeyword(hoverNode, "return") ||
        isKeyword(hoverNode, "if") ||
        isKeyword(hoverNode, "else") ||
        isKeyword(hoverNode, "try") ||
        isKeyword(hoverNode, "catch") ||
        isKeyword(hoverNode, "repeat") ||
        isKeyword(hoverNode, "while") ||
        isKeyword(hoverNode, "do") ||
        isKeyword(hoverNode, "until") ||
        isKeyword(hoverNode, "foreach")
    ) {
        return generateKeywordMarkdownHoverDocFor(hoverNode)
    }

    if (parent?.type === "foreach_statement" && hoverNode.type === "in") {
        return generateKeywordMarkdownHoverDocFor(hoverNode)
    }

    // Keywords within type ascriptions:
    // - as
    // - map<K, V>
    // - bounced<M>
    // - ? for optionals (not a keyword per se, but just in case)
    //   TODO: optional_type node from the latest tree-sitter-tact
    //         is not supported here yet

    // TODO: debug me pls
    if (parent?.type === "tlb_serialization" && hoverNode.type === "as") {
        return generateKeywordMarkdownHoverDocFor(hoverNode)
    }

    if (parent?.type === "map_type" && hoverNode.type === "map") {
        return generateKeywordMarkdownHoverDocFor(hoverNode)
    }

    if (parent?.type === "bounced_type" && hoverNode.type === "bounced") {
        return generateKeywordMarkdownHoverDocFor(hoverNode)
    }

    if (
        hoverNode.type === "receive" ||
        hoverNode.type === "external" ||
        hoverNode.type === "bounced"
    ) {
        const parent = hoverNode.parent
        if (!parent) return null
        const func = new MessageFunction(parent, file)
        const doc = generateReceiverDoc(func)
        if (doc === null) return null

        return {
            range: asLspRange(hoverNode),
            contents: {
                kind: "markdown",
                value: doc,
            },
        }
    }

    if (hoverNode.type === "init") {
        const parent = hoverNode.parent
        if (!parent) return null
        const func = new InitFunction(parent, file)
        const doc = generateInitDoc(func)
        if (doc === null) return null

        return {
            range: asLspRange(hoverNode),
            contents: {
                kind: "markdown",
                value: doc,
            },
        }
    }

    if (
        hoverNode.type === "integer" &&
        hoverNode.parent?.type !== "argument" &&
        settings.documentation.showNumbersInDifferentNumberSystems
    ) {
        const num = BigInt(hoverNode.text)
        const bin = num.toString(2)
        const dec = num.toString(10)
        const hex = num.toString(16)

        const doc = `**Binary**: 0b${bin}\n\n**Decimal**: ${dec}\n\n**Hexadecimal**: 0x${hex}`
        return {
            range: asLspRange(hoverNode),
            contents: {
                kind: "markdown",
                value: doc,
            },
        }
    }

    // Hover documentation for 10 in `throwIf(10, cond)
    if (hoverNode.type === "integer" && hoverNode.parent?.type === "argument") {
        const call = hoverNode.parent.parent?.parent
        if (!call) return null
        if (call.type !== "static_call_expression") return null
        const name = call.childForFieldName("name")?.text
        if (!name) return null

        if (
            ![
                "throw",
                "throwIf",
                "throwUnless",
                "nativeThrow",
                "nativeThrowIf",
                "nativeThrowUnless",
            ].includes(name)
        ) {
            return null
        }

        const doc = generateExitCodeDocumentation(Number.parseInt(hoverNode.text))
        if (doc === null) return null

        return {
            range: asLspRange(hoverNode),
            contents: {
                kind: "markdown",
                value: doc,
            },
        }
    }

    if (
        hoverNode.type !== "identifier" &&
        hoverNode.type !== "type_identifier" &&
        hoverNode.type !== "self"
    ) {
        return null
    }

    const res = Reference.resolve(NamedNode.create(hoverNode, file))
    if (res === null) {
        if (process.env["TACT_LS_DEV"] !== "true") {
            return null
        }

        return {
            range: asLspRange(hoverNode),
            contents: {
                kind: "plaintext",
                value: hoverNode.type,
            },
        }
    }

    const doc = await docs.generateDocFor(res, hoverNode)
    if (doc === null) return null

    return {
        range: asLspRange(hoverNode),
        contents: {
            kind: "markdown",
            value: doc,
        },
    }
}
