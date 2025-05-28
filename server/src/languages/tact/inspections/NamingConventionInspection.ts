//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import type {Diagnostic, DiagnosticSeverity} from "vscode-languageserver"
import type {TactFile} from "@server/languages/tact/psi/TactFile"
import {Inspection, InspectionId, InspectionIds} from "./Inspection"
import {asLspRange} from "@server/utils/position"
import {NamedNode} from "@server/languages/tact/psi/TactNode"
import {RecursiveVisitor} from "@server/languages/tact/psi/RecursiveVisitor"
import * as lsp from "vscode-languageserver"

export class NamingConventionInspection implements Inspection {
    public readonly id: InspectionId = InspectionIds.NAMING_CONVENTION

    public inspect(file: TactFile): Diagnostic[] {
        const diagnostics: Diagnostic[] = []

        this.checkPascalCase(
            file.getContracts(),
            "Contract",
            diagnostics,
            lsp.DiagnosticSeverity.Error,
        )
        this.checkPascalCase(file.getTraits(), "Trait", diagnostics, lsp.DiagnosticSeverity.Error)
        this.checkPascalCase(
            file.getMessages(),
            "Message",
            diagnostics,
            lsp.DiagnosticSeverity.Error,
        )
        this.checkPascalCase(file.getStructs(), "Struct", diagnostics, lsp.DiagnosticSeverity.Error)
        this.checkPascalCase(
            file.getPrimitives(),
            "Primitive",
            diagnostics,
            lsp.DiagnosticSeverity.Error,
        )

        this.checkCamelCase(file.getFuns(), "Function", diagnostics, lsp.DiagnosticSeverity.Warning)

        for (const struct of file.getStructs()) {
            this.checkCamelCase(
                struct.fields(),
                "Field",
                diagnostics,
                lsp.DiagnosticSeverity.Warning,
            )
        }
        for (const message of file.getMessages()) {
            this.checkCamelCase(
                message.fields(),
                "Field",
                diagnostics,
                lsp.DiagnosticSeverity.Warning,
            )
        }
        for (const contract of file.getContracts()) {
            this.checkCamelCase(
                contract.ownFields(),
                "Field",
                diagnostics,
                lsp.DiagnosticSeverity.Warning,
            )

            this.checkCamelCase(
                contract.ownMethods().filter(it => !it.isGetMethod), // don't check get methods
                "Method",
                diagnostics,
                lsp.DiagnosticSeverity.Warning,
            )
        }
        for (const trait of file.getTraits()) {
            this.checkCamelCase(
                trait.ownFields(),
                "Field",
                diagnostics,
                lsp.DiagnosticSeverity.Warning,
            )

            this.checkCamelCase(
                trait.ownMethods().filter(it => !it.isGetMethod), // don't check get methods
                "Method",
                diagnostics,
                lsp.DiagnosticSeverity.Warning,
            )
        }

        for (const fun of file.getFuns()) {
            this.checkCamelCase(
                fun.parameters(),
                "Parameter",
                diagnostics,
                lsp.DiagnosticSeverity.Information,
            )
        }

        for (const contract of file.getContracts()) {
            this.checkCamelCase(
                contract.parameters(),
                "Parameter",
                diagnostics,
                lsp.DiagnosticSeverity.Information,
            )
        }
        for (const trait of file.getTraits()) {
            this.checkCamelCase(
                trait.parameters(),
                "Parameter",
                diagnostics,
                lsp.DiagnosticSeverity.Information,
            )
        }

        this.checkVariables(file, diagnostics)

        return diagnostics
    }

    private checkVariables(file: TactFile, diagnostics: Diagnostic[]): void {
        RecursiveVisitor.visit(file.rootNode, node => {
            if (node.type === "destruct_bind") {
                const target = node.childForFieldName("bind") ?? node.childForFieldName("name")
                if (target && !this.isCamelCase(target.text)) {
                    diagnostics.push({
                        range: asLspRange(target),
                        message: `Variable name '${target.text}' should be in camelCase`,
                        severity: lsp.DiagnosticSeverity.Information,
                        source: "tact",
                        code: this.id,
                    })
                }
                return
            }

            if (node.type === "let_statement") {
                const nameNode = node.childForFieldName("name")
                if (nameNode && !this.isCamelCase(nameNode.text)) {
                    diagnostics.push({
                        range: asLspRange(nameNode),
                        message: `Variable name '${nameNode.text}' should be in camelCase`,
                        severity: lsp.DiagnosticSeverity.Information,
                        source: "tact",
                        code: this.id,
                    })
                }
            }
        })
    }

    private checkPascalCase(
        elements: NamedNode[],
        elementType: string,
        diagnostics: Diagnostic[],
        severity: DiagnosticSeverity,
    ): void {
        for (const element of elements) {
            const name = element.name()
            const nameIdentifier = element.nameIdentifier()

            if (nameIdentifier && !this.isPascalCase(name)) {
                diagnostics.push({
                    range: asLspRange(nameIdentifier),
                    message: `${elementType} name '${name}' should be in PascalCase`,
                    severity: severity,
                    source: "tact",
                    code: this.id,
                })
            }
        }
    }

    private checkCamelCase(
        elements: NamedNode[],
        elementType: string,
        diagnostics: Diagnostic[],
        severity: DiagnosticSeverity,
    ): void {
        for (const element of elements) {
            const name = element.name()
            const nameIdentifier = element.nameIdentifier()

            if (nameIdentifier && !this.isCamelCase(name)) {
                diagnostics.push({
                    range: asLspRange(nameIdentifier),
                    message: `${elementType} name '${name}' should be in camelCase`,
                    severity: severity,
                    source: "tact",
                    code: this.id,
                })
            }
        }
    }

    private isPascalCase(name: string): boolean {
        if (name.length === 0) return true
        const firstLetter = name[0]
        return firstLetter === firstLetter.toUpperCase()
    }

    private isCamelCase(name: string): boolean {
        if (name === "_") {
            return true
        }
        return /^[_a-z][\dA-Za-z]*$/.test(name)
    }
}
