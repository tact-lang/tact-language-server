import type {Intention, IntentionContext} from "@server/intentions/Intention"
import type {WorkspaceEdit} from "vscode-languageserver"
import type {File} from "@server/psi/File"
import {asLspRange, asParserPoint} from "@server/utils/position"
import type {Position} from "vscode-languageclient"
import {FileDiff} from "@server/utils/FileDiff"
import type {Node as SyntaxNode} from "web-tree-sitter"
import {NamedNode} from "@server/psi/Node"
import {Contract, Fun, Struct, Message, Trait, Constant, Primitive} from "@server/psi/Decls"
import * as path from "node:path"
import {fileURLToPath} from "node:url"
import * as lsp from "vscode-languageserver"
import {filePathToUri} from "@server/indexing-root"

export class ExtractToFile implements Intention {
    public readonly id: string = "tact.extract-to-file"
    public readonly name: string = "Extract to new file..."

    private static findExtractableElement(ctx: IntentionContext): NamedNode | null {
        const node = nodeAtPosition(ctx.position, ctx.file)
        if (!node) return null

        let current: SyntaxNode | null = node
        while (current) {
            const element = ExtractToFile.createElementFromNode(current, ctx.file)
            if (element && ExtractToFile.isExtractable(element)) {
                return element
            }
            current = current.parent
        }

        return null
    }

    private static createElementFromNode(node: SyntaxNode, file: File): NamedNode | null {
        switch (node.type) {
            case "global_function": {
                return new Fun(node, file)
            }
            case "struct": {
                return new Struct(node, file)
            }
            case "message": {
                return new Message(node, file)
            }
            case "contract": {
                return new Contract(node, file)
            }
            case "trait": {
                return new Trait(node, file)
            }
            case "global_constant": {
                return new Constant(node, file)
            }
            case "primitive": {
                return new Primitive(node, file)
            }
            default: {
                return null
            }
        }
    }

    private static isExtractable(element: NamedNode): boolean {
        return (
            element instanceof Fun ||
            element instanceof Struct ||
            element instanceof Message ||
            element instanceof Trait ||
            element instanceof Contract ||
            element instanceof Constant ||
            element instanceof Primitive
        )
    }

    private static isTopLevel(element: NamedNode): boolean {
        const parent = element.node.parent
        return parent?.type === "source_file"
    }

    public isAvailable(ctx: IntentionContext): boolean {
        const element = ExtractToFile.findExtractableElement(ctx)
        if (!element) return false

        return ExtractToFile.isTopLevel(element)
    }

    public invoke(ctx: IntentionContext): WorkspaceEdit | null {
        const element = ExtractToFile.findExtractableElement(ctx)
        if (!element) return null

        if (ctx.customFileName) {
            return this.performExtraction(ctx, element, ctx.customFileName)
        }

        return null
    }

    private performExtraction(
        ctx: IntentionContext,
        element: NamedNode,
        customFileName: string,
    ): WorkspaceEdit | null {
        const elementText = element.node.text
        const newFileUri = this.generateFileUri(customFileName, ctx.file)
        const newFileContent = this.generateFileContent(elementText)
        const documentChanges: (lsp.TextDocumentEdit | lsp.CreateFile)[] = []

        documentChanges.push(
            {
                kind: "create",
                uri: newFileUri,
            },
            {
                textDocument: {
                    uri: newFileUri,
                    version: null,
                },
                edits: [
                    {
                        range: {
                            start: {line: 0, character: 0},
                            end: {line: 0, character: 0},
                        },
                        newText: newFileContent,
                    },
                ],
            },
        )

        const currentFileDiff = FileDiff.forFile(ctx.file.uri)
        currentFileDiff.replace(asLspRange(element.node), "")

        const importPath = this.generateImportPath(customFileName)
        const importStatement = `import "${importPath}";`
        const importPosition = ctx.file.positionForNextImport()
        const extraLine = importPosition.line === 0 && ctx.file.imports().length === 0 ? "\n" : ""
        currentFileDiff.appendAsPrevLine(importPosition.line, `${importStatement}${extraLine}`)

        documentChanges.push({
            textDocument: {
                uri: ctx.file.uri,
                version: null,
            },
            edits: currentFileDiff.toTextEdits(),
        })

        return {
            documentChanges: documentChanges,
        }
    }

    private generateFileName(elementName: string): string {
        const snakeCaseName = elementName
            .replace(/([A-Z])/g, "_$1")
            .toLowerCase()
            .replace(/^_/, "")

        return `${snakeCaseName}.tact`
    }

    private generateFileUri(fileName: string, currentFile: File): string {
        const currentFilePath = fileURLToPath(currentFile.uri)
        const currentDir = path.dirname(currentFilePath)
        const newFilePath = path.join(currentDir, fileName)
        return filePathToUri(newFilePath)
    }

    private generateImportPath(fileName: string): string {
        return `./${fileName.replace(".tact", "")}`
    }

    private generateFileContent(elementText: string): string {
        return elementText + "\n"
    }

    public getSuggestedFileName(ctx: IntentionContext): string | null {
        const element = ExtractToFile.findExtractableElement(ctx)
        if (!element) return null
        return this.generateFileName(element.name())
    }

    public findExtractableElement(ctx: IntentionContext): NamedNode | null {
        return ExtractToFile.findExtractableElement(ctx)
    }
}

function nodeAtPosition(pos: Position, file: File): SyntaxNode | null {
    const cursorPosition = asParserPoint(pos)
    return file.rootNode.descendantForPosition(cursorPosition)
}
