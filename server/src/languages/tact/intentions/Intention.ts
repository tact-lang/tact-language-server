//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type {WorkspaceEdit} from "vscode-languageserver"
import type {TactFile} from "@server/languages/tact/psi/TactFile"
import type {Position} from "vscode-languageclient"
import type {Range} from "vscode-languageserver-textdocument"

export interface IntentionContext {
    readonly file: TactFile
    readonly range: Range
    readonly position: Position
    readonly noSelection: boolean
    readonly customFileName?: string
}

export interface IntentionArguments {
    readonly fileUri: string
    readonly range: Range
    readonly position: Position
    readonly customFileName?: string
}

export interface Intention {
    readonly id: string
    readonly name: string

    isAvailable(ctx: IntentionContext): boolean

    invoke(ctx: IntentionContext): WorkspaceEdit | null
}

export interface AsyncIntention {
    readonly id: string
    readonly name: string

    isAvailable(ctx: IntentionContext): boolean

    invoke(ctx: IntentionContext): Promise<WorkspaceEdit | null>
}
