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
    MISSED_FIELD_IN_CONTRACT: "missed-field-in-contract",
    NOT_IMPORTED_SYMBOL: "not-imported-symbol",
    DONT_USE_TEXT_RECEIVERS: "dont-use-text-receivers",
    DONT_USE_DEPLOYABLE: "dont-use-deployable",
    MISTI: "misti",
} as const

export type InspectionId = (typeof InspectionIds)[keyof typeof InspectionIds]

export interface Inspection {
    readonly id: InspectionId
    inspect(file: File): Promise<lsp.Diagnostic[]> | lsp.Diagnostic[]
}
