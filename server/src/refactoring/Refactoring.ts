import * as lsp from "vscode-languageserver"
import {File} from "../psi/File"

export interface RefactoringContext {
    file: File
    selection: lsp.Range
}

export interface RefactoringResult {
    edit: lsp.WorkspaceEdit
    error?: string
}

export interface TextDocumentRangeParams {
    textDocument: lsp.TextDocumentIdentifier
    range: lsp.Range
}

export abstract class Refactoring {
    abstract execute(context: RefactoringContext): Promise<RefactoringResult>
}
