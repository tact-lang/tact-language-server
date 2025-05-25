import * as lsp from "vscode-languageserver"
import {File} from "@server/psi/File"

export const InspectionIds = {
    COMPILER: "tact-compiler-errors",
    UNUSED_PARAMETER: "unused-parameter",
    EMPTY_BLOCK: "empty-block",
    REWRITE: "rewrite",
    UNUSED_VARIABLE: "unused-variable",
    STRUCT_INITIALIZATION: "struct-initialization",
    UNUSED_CONTRACT_MEMBERS: "unused-contract-members",
    UNUSED_IMPORT: "unused-import",
    MISSED_METHOD_IN_CONTRACT: "missed-members-in-contract",
    NOT_IMPORTED_SYMBOL: "not-imported-symbol",
    DONT_USE_TEXT_RECEIVERS: "dont-use-text-receivers",
    DONT_USE_DEPLOYABLE: "dont-use-deployable",
    REWRITE_AS_AUGMENTED_ASSIGNMENT: "rewrite-as-augmented-assignment",
    CAN_BE_STANDALONE_FUNCTION: "can-be-standalone-function",
    CAN_BE_INLINE_FUNCTION: "can-be-inline-function",
    USE_EXPLICIT_STRING_RECEIVER: "use-explicit-string-receiver",
    IMPLICIT_RETURN_VALUE_DISCARD: "implicit-return-value-discard",
    IMPLICIT_MESSAGE_OPCODE: "implicit-message-opcode",
    MISSPELLED_KEYWORD: "misspelled-keyword",
    DEPRECATED_SYMBOL_USAGE: "deprecated-symbol-usage",
    MISTI: "misti",
} as const

export type InspectionId = (typeof InspectionIds)[keyof typeof InspectionIds]

export interface Inspection {
    readonly id: InspectionId
    inspect(file: File): Promise<lsp.Diagnostic[]> | lsp.Diagnostic[]
}
