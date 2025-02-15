import type * as lsp from "vscode-languageserver"

export const GetTypeAtPositionRequest = "tact/getTypeAtPosition"
export const GetDocumentationAtPositionRequest = "tact/executeHoverProvider"
export const SetToolchainVersionNotification = "tact/setToolchainVersion"

export interface GetTypeAtPositionParams {
    textDocument: {
        uri: string
    }
    position: {
        line: number
        character: number
    }
}

export interface SetToolchainVersionParams {
    version: {
        number: string
        commit: string
    }
}

export interface GetTypeAtPositionResponse {
    type: string | null
}

export type GetDocumentationAtPositionResponse = lsp.Hover
