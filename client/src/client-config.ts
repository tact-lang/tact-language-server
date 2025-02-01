import * as vscode from "vscode"
import {defaultConfig, TactPluginConfigScheme} from "@shared/config-scheme"

let cachedClientConfig: TactPluginConfigScheme | undefined = undefined

export function getClientConfiguration(): TactPluginConfigScheme {
    if (cachedClientConfig) {
        return cachedClientConfig
    }

    let obj = {} as {[k in string]: unknown}
    let w = vscode.workspace.getConfiguration("tact")
    for (let key in defaultConfig) {
        let value = w.get(key)
        if (value !== undefined) {
            obj[key] = value
        }
    }

    cachedClientConfig = obj as TactPluginConfigScheme
    return cachedClientConfig
}

export function resetClientConfigCache() {
    cachedClientConfig = undefined
}
