import * as vscode from "vscode"
import {defaultConfig, TactPluginConfigScheme} from "@shared/config-scheme"

let cachedClientConfig: TactPluginConfigScheme | undefined = undefined

export function getClientConfiguration(): TactPluginConfigScheme {
    if (cachedClientConfig) {
        return cachedClientConfig
    }

    const obj = {} as Record<string, unknown>
    const w = vscode.workspace.getConfiguration("tact")
    for (const key in defaultConfig) {
        const value = w.get(key)
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
