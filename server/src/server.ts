import * as lsp from 'vscode-languageserver';
import {connection, ILspHandler} from './connection';
import {InitializeParams, TextDocumentSyncKind} from 'vscode-languageserver/node';
import {InitializeResult} from 'vscode-languageserver-protocol';
import {DocumentStore} from "./document-store";
import {readFileSync} from "fs";
import {createParser, initParser} from "./parser";
import {asLspRange, asParserPoint} from "./utils/position";
import {Node, Reference, File, ScopeProcessor} from "./reference";
import {CompletionItemKind, InlayHint, InlayHintKind, Location} from "vscode-languageserver-types";
import {TypeInferer} from "./TypeInferer";
import {RecursiveVisitor} from "./visitor";
import {ReferenceParams} from "vscode-languageserver";

const CODE_FENCE = "```"

function getOffsetFromPosition(fileContent: string, line: number, column: number): number {
    const lines = fileContent.split('\n');
    if (line < 1 || line > lines.length) {
        return 0;
    }

    const targetLine = lines[line];
    if (column < 1 || column > targetLine.length + 1) {
        return 0;
    }

    let offset = 0;
    for (let i = 0; i < line; i++) {
        offset += lines[i].length + 1; // +1 для символа новой строки '\n'
    }
    offset += column - 1;
    return offset;
}

connection.onInitialize(async (params: InitializeParams): Promise<InitializeResult> => {
    await initParser(params.initializationOptions.treeSitterWasmUri, params.initializationOptions.langWasmUri);

    const documents = new DocumentStore(connection);

    documents.onDidOpen(event => {
        console.log(event.document.uri);
    });

    const getTree = (path: string) => {
        const content = readFileSync(path).toString();
        const parser = createParser()
        return parser.parse(content);
    }

    connection.onRequest(lsp.HoverRequest.type, async (params: lsp.HoverParams): Promise<lsp.Hover | null> => {
        const path = params.textDocument.uri.substring(7)
        const tree = getTree(path)

        let cursorPosition = asParserPoint(params.position)
        let hoverNode = tree.rootNode.descendantForPosition(cursorPosition)

        const element = new Node(hoverNode, new File(path))
        const ref = new Reference(element)

        const res = ref.resolve()
        if (res == null) return {
            range: asLspRange(hoverNode),
            contents: {
                kind: 'plaintext',
                value: hoverNode.type
            }
        }

        if (res.node.type == 'global_function') {
            return {
                range: asLspRange(hoverNode),
                contents: {
                    kind: 'markdown',
                    value: `${CODE_FENCE}\nfun ${res.name()}(...)\n${CODE_FENCE}`
                }
            }
        }

        if (res.node.type == 'struct') {
            return {
                range: asLspRange(hoverNode),
                contents: {
                    kind: 'markdown',
                    value: `${CODE_FENCE}\nstruct ${res.name()}\n${CODE_FENCE}`
                }
            }
        }

        if (res.node.type == 'field') {
            const typeNode = res.node.childForFieldName("type")!!
            let type = new TypeInferer().inferType(new Node(typeNode, res.file))
            return {
                range: asLspRange(hoverNode),
                contents: {
                    kind: 'markdown',
                    value: `${CODE_FENCE}\n${res.name()}: ${type?.qualifiedName()}\n${CODE_FENCE}`
                }
            }
        }

        if (res.node.parent!!.type == 'let_statement') {
            let type = new TypeInferer().inferType(res)

            return {
                range: asLspRange(hoverNode),
                contents: {
                    kind: 'markdown',
                    value: `${CODE_FENCE}\nlet ${res.name()}: ${type?.qualifiedName()}\n${CODE_FENCE}`
                }
            }
        }

        return {
            range: asLspRange(hoverNode),
            contents: {
                kind: 'plaintext',
                value: hoverNode.type
            }
        }
    })

    connection.onRequest(lsp.DefinitionRequest.type, async (params: lsp.DefinitionParams): Promise<lsp.Location[] | lsp.LocationLink[]> => {
        const uri = params.textDocument.uri;
        const path = uri.substring(7)
        const tree = getTree(path)

        const cursorPosition = asParserPoint(params.position)
        const hoverNode = tree.rootNode.descendantForPosition(cursorPosition)

        if (hoverNode.type !== 'identifier' && hoverNode.type !== 'type_identifier') {
            return []
        }

        const element = new Node(hoverNode, new File(path))
        const ref = new Reference(element)

        const res = ref.resolve()
        if (res == null) return []

        const ident = res.nameIdentifier();
        if (ident === null) return []

        return [{
            uri: uri,
            range: asLspRange(ident),
        }]
    })

    connection.onRequest(lsp.CompletionRequest.type, async (params: lsp.CompletionParams): Promise<lsp.CompletionItem[]> => {
        const uri = params.textDocument.uri;
        const path = uri.substring(7)
        const content = readFileSync(path).toString();
        const parser = createParser()

        const offset = getOffsetFromPosition(content, params.position.line, params.position.character + 1)
        const start = content.slice(0, offset)
        const end = content.slice(offset)

        const newContent = start + "dummyIdentifier" + end
        const tree = parser.parse(newContent);

        const cursorPosition = asParserPoint(params.position)
        const hoverNode = tree.rootNode.descendantForPosition(cursorPosition)
        if (hoverNode.type !== 'identifier') {
            return []
        }

        const element = new Node(hoverNode, new File(path))
        const ref = new Reference(element)

        class CompletionScopeProcessor implements ScopeProcessor {
            constructor(private result: Node[]) {
            }

            execute(node: Node): boolean {
                this.result.push(node)
                return true
            }
        }

        let result: Node[] = []
        ref.processResolveVariants(new CompletionScopeProcessor(result))

        return result.map((el): lsp.CompletionItem => {
            const kind = el.node.type == "global_function" || el.node.type == "asm_function" ?
                CompletionItemKind.Function :
                CompletionItemKind.Variable;
            return {
                kind: kind,
                label: el.name()
            }
        })
    });

    connection.onRequest(lsp.InlayHintRequest.type, async (params: lsp.InlayHintParams): Promise<InlayHint[] | null> => {
        const uri = params.textDocument.uri;
        const path = uri.substring(7)
        const tree = getTree(path)

        const result: InlayHint[] = []

        RecursiveVisitor.visit(tree.rootNode, (n): boolean => {
            if (n.type === 'let_statement') {
                const typeNode = n.childForFieldName('type')
                if (typeNode) return true // already have typehint

                const expr = n.childForFieldName('value')
                if (!expr) return true

                const name = n.childForFieldName('name')
                if (!name) return true

                const type = new TypeInferer().inferType(new Node(expr, new File(path)))
                if (!type) return true

                result.push({
                    kind: InlayHintKind.Type,
                    label: `: ${type.qualifiedName()}`,
                    position: {
                        line: name.endPosition.row,
                        character: name.endPosition.column,
                    }
                })
            }

            return true
        })

        if (result.length > 0) {
            return result
        }

        return null
    })

    connection.onRequest(lsp.ReferencesRequest.type, async (params: ReferenceParams): Promise<Location[] | null> => {
        const uri = params.textDocument.uri;
        const path = uri.substring(7)
        const tree = getTree(path)

        const cursorPosition = asParserPoint(params.position)
        const hoverNode = tree.rootNode.descendantForPosition(cursorPosition)

        if (hoverNode.type !== 'identifier') {
            return []
        }

        const parent = hoverNode.parent
        if (parent === null) return null

        const result: Location[] = []

        if (parent.type === 'global_function') {
            RecursiveVisitor.visit(tree.rootNode, (n): boolean => {
                if (n.type === 'identifier') {
                    const identParent = n.parent
                    if (identParent === null) return true

                    if (identParent.type === 'global_function') return true

                    if (n.text !== hoverNode.text) return true

                    const element = new Node(hoverNode, new File(path))
                    const ref = new Reference(element)

                    const res = ref.resolve()
                    if (!res) return true

                    const identifier = res.nameIdentifier();
                    if (!identifier) return true

                    if (identifier.text == hoverNode.text) {
                        result.push({
                            uri: uri,
                            range: asLspRange(n)
                        })
                    }
                }

                return true
            })
        }

        return result
    })

    console.log('Tact language server is ready!');

    return {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental,
            // codeActionProvider: true,
            // documentSymbolProvider: true,
            definitionProvider: true,
            // renameProvider: true,
            hoverProvider: true,
            inlayHintProvider: true,
            referencesProvider: true,
            // documentFormattingProvider: true,
            completionProvider: {
                triggerCharacters: ['.']
            },
        }
    }
})

connection.listen();
