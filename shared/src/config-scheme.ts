//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio

// package.json, configuration properties keys
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface TactPluginConfigScheme {}

// package.json, configuration properties default values
export const defaultConfig: TactPluginConfigScheme = {}

export interface ClientOptions {
    readonly treeSitterWasmUri: string
    readonly tactLangWasmUri: string
    readonly fiftLangWasmUri: string
    readonly tlbLangWasmUri: string
}
