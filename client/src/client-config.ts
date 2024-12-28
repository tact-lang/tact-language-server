import * as vscode from "vscode";
import {defaultConfig, TactPluginConfigScheme} from "../../shared/src/config-scheme";

let cachedClientConfig: TactPluginConfigScheme | undefined = undefined

export function getClientConfiguration(): TactPluginConfigScheme {
  if (cachedClientConfig) {
    return cachedClientConfig
  }

  let obj = {} as { [k in string]: any }
  let w = vscode.workspace.getConfiguration('tolk')
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
