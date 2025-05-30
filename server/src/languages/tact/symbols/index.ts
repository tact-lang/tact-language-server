import {TactFile} from "@server/languages/tact/psi/TactFile"
import * as lsp from "vscode-languageserver"
import {SymbolKind} from "vscode-languageserver"
import {getDocumentSettings} from "@server/settings/settings"
import {NamedNode, TactNode} from "@server/languages/tact/psi/TactNode"
import {
    Constant,
    Contract,
    Field,
    Fun,
    Message,
    Primitive,
    StorageMembersOwner,
    Struct,
    Trait,
} from "@server/languages/tact/psi/Decls"
import {asLspRange, asNullableLspRange} from "@server/utils/position"
import {ScopeProcessor} from "@server/languages/tact/psi/Reference"
import {index, IndexKey} from "@server/languages/tact/indexes"
import {ResolveState} from "@server/psi/ResolveState"

export async function provideTactDocumentSymbols(file: TactFile): Promise<lsp.DocumentSymbol[]> {
    const settings = await getDocumentSettings(file.uri)

    const result: lsp.DocumentSymbol[] = []

    function symbolDetail(element: NamedNode | Fun | Field | Constant): string {
        if (element instanceof Fun) {
            return element.signaturePresentation()
        }
        if (element instanceof Field) {
            const type = element.typeNode()?.node.text ?? "unknown"
            return `: ${type}`
        }
        if (element instanceof Constant) {
            const type = element.typeNode()?.node.text ?? "unknown"
            const value = element.value()?.node.text ?? "unknown"
            return `: ${type} = ${value}`
        }
        return ""
    }

    function createSymbol(element: NamedNode): lsp.DocumentSymbol {
        const detail = symbolDetail(element)
        const kind = symbolKind(element)
        const children = symbolChildren(element)

        return {
            name: element.name(),
            kind: kind,
            range: asLspRange(element.node),
            detail: detail,
            selectionRange: asNullableLspRange(element.nameIdentifier()),
            children: children,
        }
    }

    function addMessageFunctions(element: StorageMembersOwner, to: lsp.DocumentSymbol[]): void {
        const messageFunctions = element.messageFunctions()
        messageFunctions.forEach(messageFunction => {
            to.push({
                name: messageFunction.nameLike(),
                range: asLspRange(messageFunction.node),
                selectionRange: asNullableLspRange(messageFunction.kindIdentifier()),
                kind: SymbolKind.Method,
            })
        })
    }

    function symbolChildren(element: NamedNode): lsp.DocumentSymbol[] {
        const children: NamedNode[] = []
        const additionalChildren: lsp.DocumentSymbol[] = []

        if (element instanceof Struct && settings.documentSymbols.showStructFields) {
            children.push(...element.fields())
        }

        if (element instanceof Message && settings.documentSymbols.showMessageFields) {
            children.push(...element.fields())
        }

        if (element instanceof Contract) {
            children.push(
                ...element.ownConstants(),
                ...element.ownFields(),
                ...element.ownMethods(),
            )

            const initFunction = element.initFunction()
            if (initFunction) {
                additionalChildren.push({
                    name: initFunction.nameLike(),
                    range: asNullableLspRange(initFunction.node),
                    selectionRange: asNullableLspRange(initFunction.initIdentifier()),
                    kind: SymbolKind.Constructor,
                })
            }

            addMessageFunctions(element, additionalChildren)
        }

        if (element instanceof Trait) {
            children.push(
                ...element.ownConstants(),
                ...element.ownFields(),
                ...element.ownMethods(),
            )

            addMessageFunctions(element, additionalChildren)
        }

        return [...children.map(el => createSymbol(el)), ...additionalChildren]
    }

    file.imports().forEach(imp => {
        result.push({
            name: imp.text,
            range: asLspRange(imp),
            selectionRange: asLspRange(imp),
            kind: SymbolKind.Module,
        })
    })

    file.getFuns().forEach(n => result.push(createSymbol(n)))
    file.getStructs().forEach(n => result.push(createSymbol(n)))
    file.getMessages().forEach(n => result.push(createSymbol(n)))
    file.getTraits().forEach(n => result.push(createSymbol(n)))
    file.getConstants().forEach(n => result.push(createSymbol(n)))
    file.getContracts().forEach(n => result.push(createSymbol(n)))
    file.getPrimitives().forEach(n => result.push(createSymbol(n)))

    return result.sort((a, b) => a.range.start.line - b.range.start.line)
}

export function provideTactWorkspaceSymbols(): lsp.WorkspaceSymbol[] {
    const result: lsp.WorkspaceSymbol[] = []

    const state = new ResolveState()
    const proc = new (class implements ScopeProcessor {
        public execute(node: TactNode, _state: ResolveState): boolean {
            if (!(node instanceof NamedNode)) return true
            const nameIdentifier = node.nameIdentifier()
            if (!nameIdentifier) return true

            result.push({
                name: node.name(),
                containerName: "",
                kind: symbolKind(node),
                location: {
                    uri: node.file.uri,
                    range: asLspRange(nameIdentifier),
                },
            })
            return true
        }
    })()

    index.processElementsByKey(IndexKey.Contracts, proc, state)
    index.processElementsByKey(IndexKey.Funs, proc, state)
    index.processElementsByKey(IndexKey.Messages, proc, state)
    index.processElementsByKey(IndexKey.Structs, proc, state)
    index.processElementsByKey(IndexKey.Traits, proc, state)
    index.processElementsByKey(IndexKey.Primitives, proc, state)
    index.processElementsByKey(IndexKey.Constants, proc, state)

    return result
}

function symbolKind(node: NamedNode): lsp.SymbolKind {
    if (node instanceof Fun) {
        return lsp.SymbolKind.Function
    }
    if (node instanceof Contract) {
        return lsp.SymbolKind.Class
    }
    if (node instanceof Message) {
        return lsp.SymbolKind.Struct
    }
    if (node instanceof Struct) {
        return lsp.SymbolKind.Struct
    }
    if (node instanceof Trait) {
        return lsp.SymbolKind.TypeParameter
    }
    if (node instanceof Primitive) {
        return lsp.SymbolKind.Property
    }
    if (node instanceof Constant) {
        return lsp.SymbolKind.Constant
    }
    if (node instanceof Field) {
        return lsp.SymbolKind.Field
    }
    return lsp.SymbolKind.Object
}
