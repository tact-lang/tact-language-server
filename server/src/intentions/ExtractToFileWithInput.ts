import type {Intention, IntentionContext} from "@server/intentions/Intention"
import type {WorkspaceEdit} from "vscode-languageserver"
import {ExtractToFile} from "./ExtractToFile"

export class ExtractToFileWithInput implements Intention {
    public readonly id: string = "tact.extract-to-file-with-input"
    public readonly name: string = "Extract to new file..."

    private readonly extractToFile: ExtractToFile = new ExtractToFile()

    public isAvailable(ctx: IntentionContext): boolean {
        return this.extractToFile.isAvailable(ctx)
    }

    public invoke(_ctx: IntentionContext): WorkspaceEdit | null {
        return null
    }

    public getElementInfo(
        ctx: IntentionContext,
    ): {elementName: string; suggestedFileName: string} | null {
        const element = this.extractToFile.findExtractableElement(ctx)
        if (!element) return null

        const suggestedFileName = this.extractToFile.getSuggestedFileName(ctx)
        if (!suggestedFileName) return null

        return {
            elementName: element.name(),
            suggestedFileName: suggestedFileName,
        }
    }
}
