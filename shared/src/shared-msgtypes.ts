import * as lsp from "vscode-languageserver"

export enum RequestFromServer {
    detectSdkForFile = "tact/detectSdkForFile",
    completionMatchingFiles = "completion/matching-files",
    fileReadContents = "file/read",
}

export enum NotificationFromServer {
    showErrorMessage = "tact/showErrorMessage",
}

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

export enum NotificationFromClient {
    initQueue = "queue/init",
}
