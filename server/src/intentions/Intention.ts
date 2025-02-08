import {WorkspaceEdit} from "vscode-languageserver"
import {File} from "@server/psi/File"
import {Position} from "vscode-languageclient"

export interface IntentionContext {
    file: File
    position: Position
}

export interface IntentionArguments {
    fileUri: string
    position: Position
}

export interface Intention {
    id: string
    name: string

    is_available(ctx: IntentionContext): boolean

    invoke(ctx: IntentionContext): WorkspaceEdit | null
}
