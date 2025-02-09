import {WorkspaceEdit} from "vscode-languageserver"
import {File} from "@server/psi/File"
import {Position} from "vscode-languageclient"
import {Range} from "vscode-languageserver-textdocument"

export interface IntentionContext {
    file: File
    range: Range
    position: Position
    noSelection: boolean
}

export interface IntentionArguments {
    fileUri: string
    range: Range
    position: Position
}

export interface Intention {
    id: string
    name: string

    is_available(ctx: IntentionContext): boolean

    invoke(ctx: IntentionContext): WorkspaceEdit | null
}
