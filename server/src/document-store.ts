import * as lsp from "vscode-languageserver"
import {TextDocuments} from "vscode-languageserver"
import {TextDocument} from "vscode-languageserver-textdocument"

export interface TextDocumentChange2 {
    document: TextDocument
    changes: {
        range: lsp.Range
        rangeOffset: number
        rangeLength: number
        text: string
    }[]
}

export class DocumentStore extends TextDocuments<TextDocument> {
    constructor(_connection: lsp.Connection) {
        super({
            create: TextDocument.create,
            update: (doc, changes, version) => {
                let event: TextDocumentChange2 = {document: doc, changes: []}

                for (const change of changes) {
                    if (!lsp.TextDocumentContentChangeEvent.isIncremental(change)) {
                        break
                    }
                    const rangeOffset = doc.offsetAt(change.range.start)
                    event.changes.push({
                        text: change.text,
                        range: change.range,
                        rangeOffset,
                        rangeLength:
                            change.rangeLength ?? doc.offsetAt(change.range.end) - rangeOffset,
                    })
                }
                return TextDocument.update(doc, changes, version)
            },
        })

        super.listen(_connection)
    }
}
