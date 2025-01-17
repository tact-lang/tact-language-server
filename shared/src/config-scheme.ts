export type TactCompilerVersion = string

// package.json, configuration properties keys
export interface TactPluginConfigScheme {}

// package.json, configuration properties default values
export const defaultConfig: TactPluginConfigScheme = {}

export type ClientOptions = {
    treeSitterWasmUri: string,
    langWasmUri: string,
}
