//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import * as lspBrowser from "vscode-languageserver/browser"
import * as lspNode from "vscode-languageserver/node"
import {Connection} from "vscode-languageserver"

declare const self: DedicatedWorkerGlobalScope

export const isWeb = (): boolean => {
    return self !== undefined && typeof importScripts === "function"
}

export const openConnection = (): Connection => {
    if (isWeb()) {
        const messageReader = new lspBrowser.BrowserMessageReader(self)
        const messageWriter = new lspBrowser.BrowserMessageWriter(self)

        return lspBrowser.createConnection(messageReader, messageWriter)
    }

    return lspNode.createConnection(lspNode.ProposedFeatures.all)
}

export const connection = openConnection()
