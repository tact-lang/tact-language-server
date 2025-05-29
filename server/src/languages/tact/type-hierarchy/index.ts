//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import * as lsp from "vscode-languageserver"
import {TactFile} from "@server/languages/tact/psi/TactFile"
import {asLspRange} from "@server/utils/position"
import {ContractDependencies} from "@server/languages/tact/psi/ContractDependencies"
import {findTactFile} from "@server/files"

export function provideTactTypeHierarchyPrepare(
    params: lsp.TypeHierarchyPrepareParams,
    file: TactFile,
): lsp.TypeHierarchyItem[] | null {
    const position = params.position
    const contracts = file.getContracts()

    for (const contract of contracts) {
        const nameIdent = contract.nameIdentifier()
        if (!nameIdent) continue

        const range = asLspRange(nameIdent)
        if (
            position.line >= range.start.line &&
            position.line <= range.end.line &&
            position.character >= range.start.character &&
            position.character <= range.end.character
        ) {
            return [
                {
                    name: contract.name(),
                    kind: lsp.SymbolKind.Class,
                    uri: file.uri,
                    range: range,
                    selectionRange: range,
                    detail: `contract ${contract.name()}`,
                },
            ]
        }
    }

    return null
}

export function provideTactTypeHierarchySupertypes(
    params: lsp.TypeHierarchySupertypesParams,
): lsp.TypeHierarchyItem[] | null {
    const item = params.item
    const file = findTactFile(item.uri)
    const contracts = file.getContracts()

    const contract = contracts.find(c => c.name() === item.name)
    if (!contract) return null

    const dependents = ContractDependencies.findGroupedDependents(contract)

    return dependents.map(dep => {
        const nameIdent = dep.source.nameIdentifier()
        const depRange = nameIdent ? asLspRange(nameIdent) : asLspRange(dep.source.node)
        return {
            name: dep.source.name(),
            kind: lsp.SymbolKind.Class,
            uri: dep.source.file.uri,
            range: depRange,
            selectionRange: depRange,
            detail: ContractDependencies.formatGroupedDependency({
                target: dep.source,
                types: dep.types,
                source: contract,
                callPath: dep.callPath,
            }),
        }
    })
}

export function provideTactTypeHierarchySubtypes(
    params: lsp.TypeHierarchySubtypesParams,
): lsp.TypeHierarchyItem[] | null {
    const item = params.item
    const file = findTactFile(item.uri)
    const contracts = file.getContracts()

    const contract = contracts.find(c => c.name() === item.name)
    if (!contract) return null

    const dependencies = ContractDependencies.findGroupedDependencies(contract)

    return dependencies.map(dep => {
        const nameIdent = dep.target.nameIdentifier()
        const depRange = nameIdent ? asLspRange(nameIdent) : asLspRange(dep.target.node)
        return {
            name: dep.target.name(),
            kind: lsp.SymbolKind.Class,
            uri: dep.target.file.uri,
            range: depRange,
            selectionRange: depRange,
            detail: ContractDependencies.formatGroupedDependency(dep),
        }
    })
}
