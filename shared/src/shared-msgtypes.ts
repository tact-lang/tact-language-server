import type * as lsp from "vscode-languageserver"

export const GetTypeAtPositionRequest = "tact/getTypeAtPosition"
export const GetDocumentationAtPositionRequest = "tact/executeHoverProvider"
export const SetToolchainVersionNotification = "tact/setToolchainVersion"
export const GetGasConsumptionForSelectionRequest = "tact/executeGetGasConsumptionForSelection"

export interface GetTypeAtPositionParams {
    readonly textDocument: {
        readonly uri: string
    }
    readonly position: {
        readonly line: number
        readonly character: number
    }
}

export interface SetToolchainVersionParams {
    readonly version: {
        readonly number: string
        readonly commit: string
    }
}

export interface GetTypeAtPositionResponse {
    readonly type: string | null
    readonly range: lsp.Range | null
}

// eslint-disable-next-line functional/type-declaration-immutability
export type GetDocumentationAtPositionResponse = lsp.Hover

export interface GetGasConsumptionForSelectionParams {
    readonly textDocument: {
        readonly uri: string
    }
    readonly range: lsp.Range
}

export interface GetGasConsumptionForSelectionResponse {
    readonly gasConsumption: {
        readonly value: number
        readonly exact: boolean
        readonly unknown: boolean
    } | null
    readonly error?: string
}
