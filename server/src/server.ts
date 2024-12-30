import * as lsp from 'vscode-languageserver';
import {
    FoldingRangeParams,
    ParameterInformation,
    ReferenceParams,
    RenameParams,
    SemanticTokens
} from 'vscode-languageserver';
import {connection} from './connection';
import {InitializeParams, TextDocumentSyncKind} from 'vscode-languageserver/node';
import {InitializeResult} from 'vscode-languageserver-protocol';
import {DocumentStore} from "./document-store";
import {readFileSync} from "fs";
import {createParser, initParser} from "./parser";
import {asLspRange, asParserPoint} from "./utils/position";
import {File, Node, Reference, ScopeProcessor} from "./reference";
import {
    CompletionItemKind,
    DocumentHighlight, DocumentHighlightKind, FoldingRange, FoldingRangeKind,
    InlayHint,
    InlayHintKind,
    Location,
    SignatureHelp
} from "vscode-languageserver-types";
import {TypeInferer} from "./TypeInferer";
import {RecursiveVisitor} from "./visitor";
import {Point, SyntaxNode} from "web-tree-sitter";
import {NotificationFromServer} from "../../shared/src/shared-msgtypes";
import {Referent} from "./referent";

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
        const res = Reference.resolve(element)
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
        const res = Reference.resolve(element)
        if (res === null) return []

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

        // Let's say we want to get autocompletion in the following code:
        //
        //   fun foo(p: Builder) {
        //      p.
        //   } // ^ caret here
        //
        // Regular parsers, including those that can recover from errors, will not
        // be able to parse this code  well enough for us to recognize this situation.
        // Some Language Servers try to do this, but they end up with a lot of
        // incomprehensible and complex code that doesn't work well.
        //
        // The approach we use is very simple, instead of parsing the code above,
        // we transform it into:
        //
        //    fun foo(p: Builder) {
        //       p.dummyIdentifier
        //    } // ^ caret here
        //
        // Which will be parsed without any problems now.
        //
        // Now that we have valid code, we can use `Reference.processResolveVariants`
        // to resolve `dummyIdentifier` into a list of possible variants, which will
        // become the autocompletion list. See `Reference` class documentation.
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

            if (n.type === 'static_call_expression') {
                const nameNode = n.childForFieldName('name')
                if (!nameNode) return true

                const element = new Node(nameNode, new File(path))
                const res = Reference.resolve(element)
                if (res == null) return true

                const parametersNode = res.node.childForFieldName('parameters')
                if (!parametersNode) return true

                const parameters = parametersNode.children.filter(value => value.type === 'parameter')

                const rawArguments = n.childForFieldName('arguments')!;
                const args = rawArguments.children.filter(value => value.type === 'argument')

                for (let i = 0; i < min(parameters.length, args.length); i++) {
                    const param = parameters[i]
                    const arg = args[i]

                    const paramName = param.childForFieldName('name')!

                    result.push({
                        kind: InlayHintKind.Parameter,
                        label: `${paramName.text}:`,
                        position: {
                            line: arg.startPosition.row,
                            character: arg.startPosition.column,
                        }
                    })
                }
            }

            return true
        })

        if (result.length > 0) {
            return result
        }

        return null
    })

    const renameHandler = async (params: RenameParams): Promise<lsp.WorkspaceEdit | null> => {
        const uri = params.textDocument.uri;
        const path = uri.substring(7)
        const tree = getTree(path)

        const cursorPosition = asParserPoint(params.position)
        const renameNode = tree.rootNode.descendantForPosition(cursorPosition)

        if (renameNode.type !== 'identifier') {
            return Promise.reject("not an identifier")
        }

        const result = new Referent(renameNode, path, tree).findReferences(true)
        if (!result) return Promise.reject("cannot find any references")

        return {
            changes: {
                [uri]: result.map(a => ({
                    range: asLspRange(a),
                    newText: params.newName
                }))
            }
        }
    };
    connection.onRequest(lsp.RenameRequest.type, (params: RenameParams) => renameHandler(params).catch(reason => {
        connection.sendNotification(NotificationFromServer.showErrorMessage, `Can not rename: ${reason}`).catch(console.error)
        return {}
    }))

    connection.onRequest(lsp.DocumentHighlightRequest.type, async (params: lsp.DocumentHighlightParams): Promise<DocumentHighlight[] | null> => {
        const uri = params.textDocument.uri;
        const path = uri.substring(7)
        const tree = getTree(path)

        const cursorPosition = asParserPoint(params.position)
        const highlightNode = tree.rootNode.descendantForPosition(cursorPosition)

        if (highlightNode.type !== 'identifier') {
            return []
        }

        const result = new Referent(highlightNode, path, tree).findReferences(true)
        if (!result) return null

        return result.map(value => {
            let kind: DocumentHighlightKind = DocumentHighlightKind.Read
            const parent = value.parent!
            if (parent.type === 'assignment_statement') {
                if (parent.childForFieldName('left')!.equals(value)) {
                    // left = 10
                    // ^^^^
                    kind = DocumentHighlightKind.Write
                }
            }

            return {
                range: asLspRange(value),
                kind: kind
            }
        })
    })

    connection.onRequest(lsp.ReferencesRequest.type, async (params: ReferenceParams): Promise<Location[] | null> => {
        const uri = params.textDocument.uri;
        const path = uri.substring(7)
        const tree = getTree(path)

        const cursorPosition = asParserPoint(params.position)
        const referenceNode = tree.rootNode.descendantForPosition(cursorPosition)

        if (referenceNode.type !== 'identifier') {
            return []
        }

        const result = new Referent(referenceNode, path, tree).findReferences(false)
        if (!result) return null

        return result.map(value => ({
            uri: uri,
            range: asLspRange(value)
        }))
    })

    connection.onRequest(lsp.SignatureHelpRequest.type, async (params: lsp.SignatureHelpParams): Promise<SignatureHelp | null> => {
        const uri = params.textDocument.uri;
        const path = uri.substring(7)
        const tree = getTree(path)

        const cursorPosition = asParserPoint(params.position)
        const hoverNode = tree.rootNode.descendantForPosition(cursorPosition)
        const call = parentOfType(hoverNode, 'static_call_expression')
        if (!call) return null

        const nameNode = call.childForFieldName('name')
        if (!nameNode) return null

        const element = new Node(nameNode, new File(path))
        const res = Reference.resolve(element)
        if (res == null) return null

        const parametersNode = res.node.childForFieldName('parameters')
        if (!parametersNode) return null

        const parameters = parametersNode.children.filter(value => value.type == 'parameter')

        // The algorithm below uses the positions of commas and parentheses to findTo find the active parameter, it is enough to find the last comma, which has a position in the line less than the cursor position. In order not to complicate the algorithm, we consider the opening bracket as a kind of comma for the zero element. If the cursor position is greater than the position of any comma, then we consider that this is the last element. the active parameter.
        //
        // foo(1000, 2000, 3000)
        //    ^    ^     ^
        //    |    |     |______ argsCommas
        //    |    |____________|
        //    |_________________|
        //
        // To find the active parameter, it is enough to find the last comma, which has a position in
        // the line less than the cursor position. To simplify the algorithm, we consider the opening
        // bracket as a kind of comma for the zero element.
        // If the cursor position is greater than the position of any comma, then we consider that this
        // is the last parameter.
        //
        // TODO: support multiline calls and functions with self

        const rawArguments = call.childForFieldName('arguments')!;
        const argsCommas = rawArguments.children.filter(value => value.text === ',' || value.text === '(')

        let currentIndex = 0
        for (let i = 0; i < argsCommas.length; i++) {
            const argComma = argsCommas[i];
            if (argComma.endPosition.column > params.position.character) {
                // found comma after cursor
                break
            }
            currentIndex = i
        }

        const parametersInfo: ParameterInformation[] = parameters.map(value => ({
            label: value.text,
        }))
        const parametersString = parametersInfo.map(el => el.label).join(', ')

        return {
            signatures: [
                {
                    label: `fun ${nameNode.text}(${parametersString})`,
                    parameters: parametersInfo,
                    activeParameter: currentIndex
                }
            ],
        }
    });

    connection.onRequest(lsp.FoldingRangeRequest.type, async (params: FoldingRangeParams): Promise<FoldingRange[] | null> => {
        const uri = params.textDocument.uri;
        const path = uri.substring(7)
        const tree = getTree(path)

        const result: FoldingRange[] = []

        const genericFolding = (start: Point, end: Point): lsp.FoldingRange => {
            return {
                kind: FoldingRangeKind.Region,
                startLine: start.row,
                endLine: end.row - 1,
                startCharacter: end.column,
                endCharacter: end.column,
            }
        }

        RecursiveVisitor.visit(tree.rootNode, (n): boolean => {
            if (n.type === 'block_statement' ||
                n.type === 'instance_argument_list' ||
                n.type === 'function_body' ||
                n.type === 'asm_function_body' ||
                n.type === 'struct_body' ||
                n.type === 'contract_body' ||
                n.type === 'trait_body'
            ) {
                const openBrace = n.firstChild!
                const closeBrace = n.lastChild!
                result.push(genericFolding(openBrace.endPosition, closeBrace.startPosition))
            }

            return true
        })

        return result
    })

    connection.onRequest(lsp.SemanticTokensRequest.type, async (params: lsp.SemanticTokensParams): Promise<SemanticTokens | null> => {
        const uri = params.textDocument.uri;
        const path = uri.substring(7)
        const tree = getTree(path)

        const builder = new lsp.SemanticTokensBuilder();

        function pushToken(n: SyntaxNode, tokenType: lsp.SemanticTokenTypes) {
            builder.push(
                n.startPosition.row,
                n.startPosition.column,
                n.endPosition.column - n.startPosition.column,
                Object.keys(lsp.SemanticTokenTypes).findIndex(value => value === tokenType.toString()),
                0,
            )
        }

        RecursiveVisitor.visit(tree.rootNode, (n): boolean => {
            if (n.type === 'asm' && n.parent!.type === 'asm_function') {
                pushToken(n, lsp.SemanticTokenTypes.keyword);
            }

            if (n.type === 'global_constant') {
                const name = n.childForFieldName('name')!
                pushToken(name, lsp.SemanticTokenTypes.property);
            }

            if (n.type === 'parameter') {
                const name = n.childForFieldName('name')!
                pushToken(name, lsp.SemanticTokenTypes.parameter);
            }

            if (n.type === 'let_statement') {
                const name = n.childForFieldName('name')!
                pushToken(name, lsp.SemanticTokenTypes.variable);
            }

            if (n.type === 'field') {
                const name = n.childForFieldName('name')!
                pushToken(name, lsp.SemanticTokenTypes.property);
            }

            if (n.type === 'identifier') {
                const element = new Node(n, new File(path))
                const resolved = Reference.resolve(element)
                if (!resolved) return true;

                if (resolved.node.parent!.type === 'let_statement') {
                    pushToken(n, lsp.SemanticTokenTypes.variable);
                }
                if (resolved.node.type === 'parameter') {
                    pushToken(n, lsp.SemanticTokenTypes.parameter);
                }
                if (resolved.node.type === 'field') {
                    pushToken(n, lsp.SemanticTokenTypes.property);
                }
            }

            return true
        })

        return builder.build()
    })

    console.log('Tact language server is ready!');

    return {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental,
            // codeActionProvider: true,
            // documentSymbolProvider: true,
            definitionProvider: true,
            renameProvider: true,
            hoverProvider: true,
            inlayHintProvider: true,
            referencesProvider: true,
            documentHighlightProvider: true,
            foldingRangeProvider: true,
            // documentFormattingProvider: true,
            completionProvider: {
                triggerCharacters: ['.']
            },
            signatureHelpProvider: {
                triggerCharacters: ['(', ','],
                retriggerCharacters: [',', ' '],
            },
            semanticTokensProvider: {
                legend: {
                    tokenTypes: Object.keys(lsp.SemanticTokenTypes),
                    tokenModifiers: Object.keys(lsp.SemanticTokenModifiers),
                },
                range: false,
                full: true,
            }
        }
    }
})

function min<T>(a: T, b: T): T {
    return a < b ? a : b
}

function parentOfType(node: SyntaxNode, ...types: string[]): SyntaxNode | null {
    let parent = node.parent

    while (true) {
        if (parent == null) return null
        if (types.find(type => parent!.type === type)) return parent
        parent = parent.parent
    }
}

connection.listen();
