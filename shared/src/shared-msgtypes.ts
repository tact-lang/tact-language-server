export enum RequestFromServer {
    detectSdkForFile = 'tact/detectSdkForFile',
    completionMatchingFiles = 'completion/matching-files',
    fileReadContents = 'file/read',
}

export enum NotificationFromServer {
    showErrorMessage = 'tact/showErrorMessage'
}
