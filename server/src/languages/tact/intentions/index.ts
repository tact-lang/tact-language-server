import type {
    Intention,
    IntentionArguments,
    IntentionContext,
} from "@server/languages/tact/intentions/Intention"
import {AddExplicitType} from "@server/languages/tact/intentions/AddExplicitType"
import {AddImport} from "@server/languages/tact/intentions/AddImport"
import {ReplaceTextReceiverWithBinary} from "@server/languages/tact/intentions/ReplaceTextReceiverWithBinary"
import {
    FillFieldsStructInit,
    FillRequiredStructInit,
} from "@server/languages/tact/intentions/FillFieldsStructInit"
import {AddFieldInitialization} from "@server/languages/tact/intentions/AddFieldInitialization"
import {
    WrapSelectedToRepeat,
    WrapSelectedToTry,
    WrapSelectedToTryCatch,
} from "@server/languages/tact/intentions/WrapSelected"
import {ExtractToFile} from "@server/languages/tact/intentions/ExtractToFile"
import * as lsp from "vscode-languageserver"
import {findTactFile, PARSED_FILES_CACHE} from "@server/files"
import {LocalSearchScope, Referent} from "@server/languages/tact/psi/Referent"
import {connection} from "@server/connection"
import {TactFile} from "@server/languages/tact/psi/TactFile"
import {File} from "@server/psi/File"
import type {Node as SyntaxNode} from "web-tree-sitter"
import {asParserPoint} from "@server/utils/position"

export const INTENTIONS: Intention[] = [
    new AddExplicitType(),
    new AddImport(),
    new ReplaceTextReceiverWithBinary(),
    new FillFieldsStructInit(),
    new FillRequiredStructInit(),
    new AddFieldInitialization(),
    new WrapSelectedToTry(),
    new WrapSelectedToTryCatch(),
    new WrapSelectedToRepeat(),
    new ExtractToFile(),
]

export async function provideExecuteTactCommand(
    params: lsp.ExecuteCommandParams,
): Promise<string | null> {
    if (params.command === "tact/executeGetScopeProvider") {
        const commandParams = params.arguments?.[0] as lsp.TextDocumentPositionParams | undefined
        if (!commandParams) return "Invalid parameters"

        const file = PARSED_FILES_CACHE.get(commandParams.textDocument.uri)
        if (!file) {
            return "File not found"
        }

        const node = nodeAtPosition(commandParams, file)
        if (!node) {
            return "Node not found"
        }

        const referent = new Referent(node, file)
        const scope = referent.useScope()
        if (!scope) return "Scope not found"

        if (scope instanceof LocalSearchScope) return scope.toString()
        return "GlobalSearchScope"
    }

    if (!params.arguments || params.arguments.length === 0) return null

    const intention = INTENTIONS.find(it => it.id === params.command)
    if (!intention) return null

    const args = params.arguments[0] as IntentionArguments

    const file = await findTactFile(args.fileUri)

    const ctx: IntentionContext = {
        file: file,
        range: args.range,
        position: args.position,
        noSelection:
            args.range.start.line === args.range.end.line &&
            args.range.start.character === args.range.end.character,
        customFileName: args.customFileName,
    }

    if (intention instanceof ExtractToFile && !ctx.customFileName) {
        const getElementInfoForExtraction = (
            intention: ExtractToFile,
            ctx: IntentionContext,
        ): {elementName: string; suggestedFileName: string} | null => {
            const element = intention.findExtractableElement(ctx)
            if (!element) return null

            const suggestedFileName = intention.getSuggestedFileName(ctx)
            if (!suggestedFileName) return null

            return {
                elementName: element.name(),
                suggestedFileName: suggestedFileName,
            }
        }

        const elementInfo = getElementInfoForExtraction(intention, ctx)
        if (!elementInfo) return null

        await connection.sendNotification("tact/extractToFileWithInput", {
            fileUri: args.fileUri,
            range: args.range,
            position: args.position,
            elementName: elementInfo.elementName,
            suggestedFileName: elementInfo.suggestedFileName,
        })

        return null
    }

    const edits = intention.invoke(ctx)
    if (!edits) return null

    await connection.sendRequest(lsp.ApplyWorkspaceEditRequest.method, {
        label: `Intention "${intention.name}"`,
        edit: edits,
    } as lsp.ApplyWorkspaceEditParams)

    return null
}

export function provideTactCodeActions(
    file: TactFile,
    params: lsp.CodeActionParams,
): lsp.CodeAction[] {
    const ctx: IntentionContext = {
        file: file,
        range: params.range,
        position: params.range.start,
        noSelection:
            params.range.start.line === params.range.end.line &&
            params.range.start.character === params.range.end.character,
    }

    const actions: lsp.CodeAction[] = []

    for (const intention of INTENTIONS) {
        if (!intention.isAvailable(ctx)) continue

        actions.push({
            title: intention.name,
            kind: lsp.CodeActionKind.QuickFix,
            command: {
                title: intention.name,
                command: intention.id,
                arguments: [
                    {
                        fileUri: file.uri,
                        range: params.range,
                        position: params.range.start,
                    } as IntentionArguments,
                ],
            },
        })
    }

    for (const diagnostic of params.context.diagnostics) {
        const data = diagnostic.data as undefined | lsp.CodeAction
        if (data === undefined || !("title" in data) || !("edit" in data)) {
            continue
        }

        actions.push(data)
    }

    return actions
}

function nodeAtPosition(params: lsp.TextDocumentPositionParams, file: File): SyntaxNode | null {
    const cursorPosition = asParserPoint(params.position)
    return file.rootNode.descendantForPosition(cursorPosition)
}
