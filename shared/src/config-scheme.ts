export type TactCompilerVersion = string

// package.json, configuration properties keys
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface TactPluginConfigScheme {}

// package.json, configuration properties default values
export const defaultConfig: TactPluginConfigScheme = {}

export type ClientOptions = {
    treeSitterWasmUri: string
    tactLangWasmUri: string
    fiftLangWasmUri: string
}
