import type * as lsp from "vscode-languageserver"

export const GetTypeAtPositionRequest = "tact/getTypeAtPosition"
export const GetDocumentationAtPositionRequest = "tact/executeHoverProvider"

export interface GetTypeAtPositionParams {
    textDocument: {
        uri: string
    }
    position: {
        line: number
        character: number
    }
}

export interface GetTypeAtPositionResponse {
    type: string | null
}

export type GetDocumentationAtPositionResponse = lsp.Hover
