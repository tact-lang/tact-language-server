import type {WorkspaceEdit} from "vscode-languageserver"
import type {File} from "@server/psi/File"
import type {Position} from "vscode-languageclient"
import type {Range} from "vscode-languageserver-textdocument"

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

    isAvailable(ctx: IntentionContext): boolean

    invoke(ctx: IntentionContext): WorkspaceEdit | null
}
