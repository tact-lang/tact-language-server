//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import {
    TypeSignatureParser,
    TypeSignatureUtils,
    TypeSignature,
} from "@server/languages/tact/search/TypeSignatureParser"
import {index, IndexKey} from "@server/languages/tact/indexes"
import {ScopeProcessor} from "@server/languages/tact/psi/Reference"
import {TactNode} from "@server/languages/tact/psi/TactNode"
import {Fun, Contract, Trait} from "@server/languages/tact/psi/Decls"
import {asLspRange} from "@server/utils/position"
import type {TypeSearchResult} from "@shared/shared-msgtypes"
import type * as lsp from "vscode-languageserver"
import {ResolveState} from "@server/psi/ResolveState"

export class TypeBasedSearch {
    /**
     * Search for functions that match the given type signature
     *
     * - "Int -> String" - functions that take an Int and return a String
     * - "_ -> Address" - functions that take any parameters and return an Address
     * - "Int, String -> Bool" - functions that take Int and String and return Bool
     * - "-> Int" - functions with no parameters that return Int
     * - "Int? -> String" - functions that take optional Int and return String
     * - "map<Int, String> -> Int" - functions that take a map and return Int
     */
    public static search(query: string): TypeSearchResult[] {
        const parser = new TypeSignatureParser(query)
        const signature = parser.parse()

        if (!signature) {
            return []
        }

        const searcher = new TypeBasedSearch()
        return searcher.findMatchingFunctions(signature)
    }

    private findMatchingFunctions(signature: TypeSignature): TypeSearchResult[] {
        const results: TypeSearchResult[] = []
        const state = new ResolveState()

        const processor = new (class implements ScopeProcessor {
            public execute(node: TactNode, _state: ResolveState): boolean {
                if (!(node instanceof Fun)) return true

                const functionSignature = node.signaturePresentation()
                if (TypeSignatureUtils.matchesSignature(functionSignature, signature)) {
                    const result = TypeBasedSearch.createSearchResult(node)
                    if (result) {
                        results.push(result)
                    }
                }

                return true
            }
        })()

        index.processElementsByKey(IndexKey.Funs, processor, state)
        this.searchInContractMethods(signature, results)
        this.searchInTraitMethods(signature, results)

        return results.sort((a, b) => a.name.localeCompare(b.name))
    }

    private searchInContractMethods(signature: TypeSignature, results: TypeSearchResult[]): void {
        const state = new ResolveState()

        const processor = new (class implements ScopeProcessor {
            public execute(node: TactNode, _state: ResolveState): boolean {
                if (!(node instanceof Contract)) return true

                const methods = node.ownMethods()
                for (const method of methods) {
                    const functionSignature = method.signaturePresentation()
                    if (TypeSignatureUtils.matchesSignature(functionSignature, signature)) {
                        const result = TypeBasedSearch.createSearchResult(method, node.name())
                        if (result) {
                            results.push(result)
                        }
                    }
                }

                return true
            }
        })()

        index.processElementsByKey(IndexKey.Contracts, processor, state)
    }

    private searchInTraitMethods(signature: TypeSignature, results: TypeSearchResult[]): void {
        const state = new ResolveState()

        const processor = new (class implements ScopeProcessor {
            public execute(node: TactNode, _state: ResolveState): boolean {
                if (!(node instanceof Trait)) return true

                const methods = node.ownMethods()
                for (const method of methods) {
                    const functionSignature = method.signaturePresentation()
                    if (TypeSignatureUtils.matchesSignature(functionSignature, signature)) {
                        const result = TypeBasedSearch.createSearchResult(method, node.name())
                        if (result) {
                            results.push(result)
                        }
                    }
                }

                return true
            }
        })()

        index.processElementsByKey(IndexKey.Traits, processor, state)
    }

    private static createSearchResult(func: Fun, containerName?: string): TypeSearchResult | null {
        const nameIdentifier = func.nameIdentifier()
        if (!nameIdentifier) return null

        const signature = func.signaturePresentation()
        const location: lsp.Location = {
            uri: func.file.uri,
            range: asLspRange(nameIdentifier),
        }

        let kind: TypeSearchResult["kind"] = "function"

        const parent = func.node.parent
        if (parent?.type === "contract") {
            kind = func.isGetMethod ? "getter" : "method"
        } else if (parent?.type === "trait") {
            kind = "method"
        }

        return {
            name: func.name(),
            signature: signature,
            location: location,
            kind: kind,
            containerName: containerName,
        }
    }
}
