//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type * as lsp from "vscode-languageserver"

export const TypeAtPositionRequest = "tact/getTypeAtPosition"
export const DocumentationAtPositionRequest = "tact/executeHoverProvider"
export const SetToolchainVersionNotification = "tact/setToolchainVersion"
export const GasConsumptionForSelectionRequest = "tact/executeGetGasConsumptionForSelection"
export const SearchByTypeRequest = "tact/searchByType"

export interface TypeAtPositionParams {
    readonly textDocument: {
        readonly uri: string
    }
    readonly position: {
        readonly line: number
        readonly character: number
    }
}

export interface EnvironmentInfo {
    readonly nodeVersion?: string
    readonly platform: string
    readonly arch: string
}

export interface ToolchainInfo {
    readonly path: string
    readonly isAutoDetected: boolean
    readonly detectionMethod?: string
}

export interface SetToolchainVersionParams {
    readonly version: {
        readonly number: string
        readonly commit: string
    }
    readonly toolchain: ToolchainInfo
    readonly environment: EnvironmentInfo
}

export interface TypeAtPositionResponse {
    readonly type: string | null
    readonly range: lsp.Range | null
}

export interface GasConsumptionForSelectionParams {
    readonly textDocument: {
        readonly uri: string
    }
    readonly range: lsp.Range
}

export interface GasConsumptionForSelectionResponse {
    readonly gasConsumption: {
        readonly value: number
        readonly exact: boolean
        readonly unknown: boolean
    } | null
    readonly error?: string
}

export interface SearchByTypeParams {
    readonly query: string
    readonly scope?: "workspace" | "everywhere"
}

export interface TypeSearchResult {
    readonly name: string
    readonly signature: string
    readonly location: lsp.Location
    readonly kind: "function" | "method" | "getter" | "constructor"
    readonly containerName?: string
}

export interface SearchByTypeResponse {
    readonly results: TypeSearchResult[]
    readonly error: string | null
}
