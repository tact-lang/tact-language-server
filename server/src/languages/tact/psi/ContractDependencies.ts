//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type {Node as SyntaxNode} from "web-tree-sitter"
import {Contract} from "./Decls"
import {RecursiveVisitor} from "./RecursiveVisitor"
import {Reference} from "./Reference"
import {NamedNode} from "./TactNode"
import {index, IndexKey} from "@server/languages/tact/indexes"
import {ResolveState} from "@server/psi/ResolveState"
import {ScopeProcessor} from "@server/languages/tact/psi/Reference"
import {TactNode} from "@server/languages/tact/psi/TactNode"

export interface ContractDependency {
    readonly target: Contract
    readonly type: "initOf" | "codeOf"
    readonly location: SyntaxNode
    readonly source: Contract
    readonly callPath?: string[]
}

export interface GroupedContractDependency {
    readonly target: Contract
    readonly types: Set<"initOf" | "codeOf">
    readonly source: Contract
    readonly callPath?: string[]
}

export class ContractDependencies {
    private static readonly functionDependencyCache: Map<string, ContractDependency[]> = new Map()

    public static findDependencies(contract: Contract): ContractDependency[] {
        const dependencies: ContractDependency[] = []

        RecursiveVisitor.visit(contract.node, (node: SyntaxNode) => {
            if (node.type === "initOf" || node.type === "codeOf") {
                const dependency = this.extractDependency(node, contract)
                if (dependency) {
                    dependencies.push(dependency)
                }
            }
            return true
        })

        const indirectDependencies = this.findIndirectDependencies(contract)
        dependencies.push(...indirectDependencies)

        return this.removeDuplicateDependencies(dependencies).filter(
            dep => dep.target.name() !== dep.source.name(),
        ) // Filter out self-dependencies
    }

    public static findGroupedDependencies(contract: Contract): GroupedContractDependency[] {
        const dependencies = this.findDependencies(contract)
        return this.groupDependencies(dependencies)
    }

    private static findIndirectDependencies(contract: Contract): ContractDependency[] {
        const dependencies: ContractDependency[] = []
        const visited: Set<string> = new Set()

        RecursiveVisitor.visit(contract.node, (node: SyntaxNode) => {
            if (node.type === "static_call_expression") {
                const nameNode = node.childForFieldName("name")
                if (!nameNode) return true

                const functionName = nameNode.text
                const indirectDeps = this.analyzeFunctionCall(functionName, contract, visited)

                for (const dep of indirectDeps) {
                    dependencies.push({
                        ...dep,
                        source: contract,
                        callPath: [functionName, ...(dep.callPath ?? [])],
                    })
                }
            }
            return true
        })

        return dependencies
    }

    private static analyzeFunctionCall(
        functionName: string,
        sourceContract: Contract,
        visited: Set<string>,
    ): ContractDependency[] {
        if (visited.has(functionName)) return []
        visited.add(functionName)

        const cacheKey = `${sourceContract.file.uri}:${functionName}`
        if (this.functionDependencyCache.has(cacheKey)) {
            return this.functionDependencyCache.get(cacheKey) ?? []
        }

        const dependencies: ContractDependency[] = []

        const functionNode = this.findFunctionDefinition(functionName, sourceContract)
        if (!functionNode) {
            this.functionDependencyCache.set(cacheKey, dependencies)
            return dependencies
        }

        RecursiveVisitor.visit(functionNode, (node: SyntaxNode) => {
            if (node.type === "initOf" || node.type === "codeOf") {
                const dependency = this.extractDependency(node, sourceContract)
                if (dependency) {
                    dependencies.push(dependency)
                }
            }

            if (node.type === "static_call_expression") {
                const nameNode = node.childForFieldName("name")
                if (nameNode) {
                    const nestedFunctionName = nameNode.text
                    const nestedDeps = this.analyzeFunctionCall(
                        nestedFunctionName,
                        sourceContract,
                        visited,
                    )
                    for (const dep of nestedDeps) {
                        dependencies.push({
                            ...dep,
                            callPath: [nestedFunctionName, ...(dep.callPath ?? [])],
                        })
                    }
                }
            }
            return true
        })

        this.functionDependencyCache.set(cacheKey, dependencies)
        visited.delete(functionName)
        return dependencies
    }

    private static findFunctionDefinition(
        functionName: string,
        sourceContract: Contract,
    ): SyntaxNode | null {
        const contractMethods = sourceContract.ownMethods()
        for (const method of contractMethods) {
            if (method.name() === functionName) {
                return method.node
            }
        }

        const globalFunctions = sourceContract.file.getFuns()
        for (const fun of globalFunctions) {
            if (fun.name() === functionName) {
                return fun.node
            }
        }

        return null
    }

    private static removeDuplicateDependencies(
        dependencies: ContractDependency[],
    ): ContractDependency[] {
        const seen: Set<string> = new Set()
        const result: ContractDependency[] = []

        for (const dep of dependencies) {
            const key = `${dep.target.name()}-${dep.type}`
            if (!seen.has(key)) {
                seen.add(key)
                result.push(dep)
            }
        }

        return result
    }

    private static groupDependencies(
        dependencies: ContractDependency[],
    ): GroupedContractDependency[] {
        const grouped: Map<string, GroupedContractDependency> = new Map()

        for (const dep of dependencies) {
            const key = dep.target.name()
            if (!grouped.has(key)) {
                grouped.set(key, {
                    target: dep.target,
                    types: new Set(),
                    source: dep.source,
                    callPath: dep.callPath,
                })
            }
            const deps = grouped.get(key)
            if (deps) {
                deps.types.add(dep.type)
            }
        }

        return [...grouped.values()]
    }

    public static findDependents(contract: Contract): ContractDependency[] {
        const dependents: ContractDependency[] = []
        const contractName = contract.name()

        const state = new ResolveState()
        const processor = new (class implements ScopeProcessor {
            public execute(node: TactNode, _state: ResolveState): boolean {
                if (!(node instanceof Contract)) return true

                if (node.name() === contractName) return true

                const deps = ContractDependencies.findDependencies(node)
                for (const dep of deps) {
                    if (dep.target.name() === contractName) {
                        dependents.push({
                            ...dep,
                            source: node,
                            target: contract,
                        })
                    }
                }

                return true
            }
        })()

        index.processElementsByKey(IndexKey.Contracts, processor, state)

        return dependents.filter(dep => dep.source.name() !== dep.target.name())
    }

    public static findGroupedDependents(contract: Contract): GroupedContractDependency[] {
        const dependents = this.findDependents(contract)
        return this.groupDependencies(dependents)
    }

    public static findAllRelatedGrouped(contract: Contract): {
        dependencies: GroupedContractDependency[]
        dependents: GroupedContractDependency[]
    } {
        return {
            dependencies: this.findGroupedDependencies(contract),
            dependents: this.findGroupedDependents(contract),
        }
    }

    private static extractDependency(
        node: SyntaxNode,
        sourceContract: Contract,
    ): ContractDependency | null {
        const nameNode = node.childForFieldName("name")
        if (!nameNode) return null

        const resolved = Reference.resolve(new NamedNode(nameNode, sourceContract.file))
        if (!(resolved instanceof Contract)) return null

        return {
            target: resolved,
            type: node.type as "initOf" | "codeOf",
            location: node,
            source: sourceContract,
        }
    }

    public static formatGroupedDependency(dependency: GroupedContractDependency): string {
        const types = [...dependency.types].sort()
        const typeText = types.length === 1 ? types[0] : types.join(" + ")

        const pathSuffix =
            dependency.callPath && dependency.callPath.length > 0
                ? ` (via ${dependency.callPath.join(" → ")})`
                : ""
        return `\`${typeText} ${dependency.target.name()}\`${pathSuffix}`
    }

    public static getDependencySummary(contract: Contract): string {
        const related = this.findAllRelatedGrouped(contract)

        if (related.dependencies.length === 0 && related.dependents.length === 0) {
            return ""
        }

        const lines: string[] = []

        if (related.dependencies.length > 0) {
            lines.push("Dependencies:")
            for (const dep of related.dependencies) {
                lines.push(`- ${this.formatGroupedDependency(dep)}`)
            }
        }

        if (related.dependents.length > 0) {
            if (lines.length > 0) lines.push("")
            lines.push("Used by:")
            for (const dep of related.dependents) {
                const types = [...dep.types].sort().map(it => `\`${it}\``)
                const typeText = types.length === 1 ? types[0] : types.join(" + ")
                const pathSuffix =
                    dep.callPath && dep.callPath.length > 0
                        ? ` (via ${dep.callPath.join(" → ")})`
                        : ""
                lines.push(`- \`${dep.source.name()}\` (${typeText})${pathSuffix}`)
            }
        }

        return lines.join("\n")
    }

    public static clearCache(): void {
        this.functionDependencyCache.clear()
    }
}
