export enum RequestFromServer {
    detectSdkForFile = "tact/detectSdkForFile",
    completionMatchingFiles = "completion/matching-files",
    fileReadContents = "file/read",
}

export enum NotificationFromServer {
    showErrorMessage = "tact/showErrorMessage",
}

export const GetTypeAtPositionRequest = "tact/getTypeAtPosition"

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

export enum NotificationFromClient {
    initQueue = "queue/init",
}
