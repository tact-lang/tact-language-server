import type {WorkspaceEdit} from "vscode-languageserver"
import type {File} from "@server/psi/File"
import type {Position} from "vscode-languageclient"
import type {Range} from "vscode-languageserver-textdocument"

export interface IntentionContext {
    readonly file: File
    readonly range: Range
    readonly position: Position
    readonly noSelection: boolean
}

export interface IntentionArguments {
    readonly fileUri: string
    readonly range: Range
    readonly position: Position
}

export interface Intention {
    readonly id: string
    readonly name: string

    isAvailable(ctx: IntentionContext): boolean

    invoke(ctx: IntentionContext): WorkspaceEdit | null
}
