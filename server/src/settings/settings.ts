//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import {connection} from "@server/connection"

export type FindUsagesScope = "workspace" | "everywhere"

export interface ToolchainConfig {
    readonly name: string
    readonly path: string
    readonly description?: string
}

export interface TactSettings {
    readonly stdlib: {
        readonly path: string | null
    }
    readonly toolchain: {
        readonly activeToolchain: string
        readonly toolchains: Record<string, ToolchainConfig>
        readonly showShortCommitInStatusBar: boolean
    }
    readonly highlighting: {
        readonly highlightCodeInComments: boolean
    }
    readonly findUsages: {
        readonly scope: FindUsagesScope
    }
    readonly hints: {
        readonly disable: boolean
        readonly types: boolean
        readonly parameters: boolean
        readonly exitCodeFormat: "decimal" | "hex"
        readonly showMethodId: boolean
        readonly showGasConsumption: boolean
        readonly showAsmInstructionGas: boolean
        readonly showExitCodes: boolean
        readonly showExplicitTLBIntType: boolean
        readonly gasFormat: string
        readonly showContinuationGas: boolean
        readonly showToCellSize: boolean
        readonly showAsciiEvaluationResult: boolean
        readonly showCrc32EvaluationResult: boolean
        readonly showMessageId: boolean
        readonly showReceiverOpcode: boolean
    }
    readonly gas: {
        readonly loopGasCoefficient: number
    }
    readonly codeLens: {
        readonly enabled: boolean
        readonly showUsages: boolean
        readonly showOverrides: boolean
        readonly showTraitImplementations: boolean
        readonly showFunctionImplementations: boolean
        readonly showParentTraitFields: boolean
        readonly showParentTraitFunctions: boolean
    }
    readonly inspections: {
        readonly disabled: readonly string[] // list of disabled inspection ids
    }
    readonly documentation: {
        readonly showTlb: boolean
        readonly showKeywordDocumentation: boolean
        readonly maximumLinesBodyToShowInDocumentation: number
        readonly showNumbersInDifferentNumberSystems: boolean
    }
    readonly fift: {
        readonly hints: {
            readonly showGasConsumption: boolean
        }
        readonly semanticHighlighting: {
            readonly enabled: boolean
        }
    }
    readonly completion: {
        readonly typeAware: boolean
        readonly addImports: boolean
    }
    readonly documentSymbols: {
        readonly showStructFields: boolean
        readonly showMessageFields: boolean
    }
    readonly linters: {
        readonly compiler: {
            readonly enable: boolean
        }
        readonly misti: {
            readonly enable: boolean
            readonly binPath: string
        }
        readonly useProblemMatcher: boolean
    }
}

const defaultSettings: TactSettings = {
    stdlib: {
        path: null,
    },
    highlighting: {
        highlightCodeInComments: true,
    },
    toolchain: {
        activeToolchain: "auto",
        toolchains: {
            auto: {
                name: "Auto-detected",
                path: "",
                description: "Automatically detect Tact compiler in node_modules",
            },
        },
        showShortCommitInStatusBar: false,
    },
    findUsages: {
        scope: "workspace",
    },
    hints: {
        disable: false,
        types: true,
        parameters: true,
        exitCodeFormat: "decimal",
        showMethodId: true,
        showGasConsumption: true,
        showAsmInstructionGas: true,
        showExitCodes: true,
        showExplicitTLBIntType: true,
        gasFormat: ": {gas}",
        showContinuationGas: true,
        showToCellSize: true,
        showAsciiEvaluationResult: true,
        showCrc32EvaluationResult: true,
        showMessageId: true,
        showReceiverOpcode: true,
    },
    gas: {
        loopGasCoefficient: 5,
    },
    codeLens: {
        enabled: true,
        showUsages: true,
        showOverrides: true,
        showTraitImplementations: true,
        showFunctionImplementations: true,
        showParentTraitFields: true,
        showParentTraitFunctions: true,
    },
    inspections: {
        disabled: [], // no disabled inspections by default
    },
    documentation: {
        showTlb: true,
        showKeywordDocumentation: true,
        maximumLinesBodyToShowInDocumentation: 2,
        showNumbersInDifferentNumberSystems: true,
    },
    fift: {
        hints: {
            showGasConsumption: true,
        },
        semanticHighlighting: {
            enabled: true,
        },
    },
    completion: {
        typeAware: true,
        addImports: true,
    },
    documentSymbols: {
        showStructFields: false,
        showMessageFields: false,
    },
    linters: {
        compiler: {
            enable: true,
        },
        misti: {
            enable: false,
            binPath: "npx misti",
        },
        useProblemMatcher: false,
    },
}

const documentSettings: Map<string, TactSettings> = new Map()

function mergeSettings(vsSettings: Partial<TactSettings>): TactSettings {
    return {
        stdlib: {
            path: vsSettings.stdlib?.path ?? defaultSettings.stdlib.path,
        },
        highlighting: {
            highlightCodeInComments:
                vsSettings.highlighting?.highlightCodeInComments ??
                defaultSettings.highlighting.highlightCodeInComments,
        },
        toolchain: {
            activeToolchain:
                vsSettings.toolchain?.activeToolchain ?? defaultSettings.toolchain.activeToolchain,
            toolchains: vsSettings.toolchain?.toolchains ?? defaultSettings.toolchain.toolchains,
            showShortCommitInStatusBar:
                vsSettings.toolchain?.showShortCommitInStatusBar ??
                defaultSettings.toolchain.showShortCommitInStatusBar,
        },
        findUsages: {
            scope: vsSettings.findUsages?.scope ?? defaultSettings.findUsages.scope,
        },
        hints: {
            disable: vsSettings.hints?.disable ?? defaultSettings.hints.disable,
            types: vsSettings.hints?.types ?? defaultSettings.hints.types,
            parameters: vsSettings.hints?.parameters ?? defaultSettings.hints.parameters,
            exitCodeFormat:
                vsSettings.hints?.exitCodeFormat ?? defaultSettings.hints.exitCodeFormat,
            showMethodId: vsSettings.hints?.showMethodId ?? defaultSettings.hints.showMethodId,
            showGasConsumption:
                vsSettings.hints?.showGasConsumption ?? defaultSettings.hints.showGasConsumption,
            showAsmInstructionGas:
                vsSettings.hints?.showAsmInstructionGas ??
                defaultSettings.hints.showAsmInstructionGas,
            showExitCodes: vsSettings.hints?.showExitCodes ?? defaultSettings.hints.showExitCodes,
            showExplicitTLBIntType:
                vsSettings.hints?.showExplicitTLBIntType ??
                defaultSettings.hints.showExplicitTLBIntType,
            gasFormat: vsSettings.hints?.gasFormat ?? defaultSettings.hints.gasFormat,
            showContinuationGas:
                vsSettings.hints?.showContinuationGas ?? defaultSettings.hints.showContinuationGas,
            showToCellSize:
                vsSettings.hints?.showToCellSize ?? defaultSettings.hints.showToCellSize,
            showAsciiEvaluationResult:
                vsSettings.hints?.showAsciiEvaluationResult ??
                defaultSettings.hints.showAsciiEvaluationResult,
            showCrc32EvaluationResult:
                vsSettings.hints?.showCrc32EvaluationResult ??
                defaultSettings.hints.showCrc32EvaluationResult,
            showMessageId: vsSettings.hints?.showMessageId ?? defaultSettings.hints.showMessageId,
            showReceiverOpcode:
                vsSettings.hints?.showReceiverOpcode ?? defaultSettings.hints.showReceiverOpcode,
        },
        gas: {
            loopGasCoefficient:
                vsSettings.gas?.loopGasCoefficient ?? defaultSettings.gas.loopGasCoefficient,
        },
        codeLens: {
            enabled: vsSettings.codeLens?.enabled ?? defaultSettings.codeLens.enabled,
            showUsages: vsSettings.codeLens?.showUsages ?? defaultSettings.codeLens.showUsages,
            showOverrides:
                vsSettings.codeLens?.showOverrides ?? defaultSettings.codeLens.showOverrides,
            showTraitImplementations:
                vsSettings.codeLens?.showTraitImplementations ??
                defaultSettings.codeLens.showTraitImplementations,
            showFunctionImplementations:
                vsSettings.codeLens?.showFunctionImplementations ??
                defaultSettings.codeLens.showFunctionImplementations,
            showParentTraitFields:
                vsSettings.codeLens?.showParentTraitFields ??
                defaultSettings.codeLens.showParentTraitFields,
            showParentTraitFunctions:
                vsSettings.codeLens?.showParentTraitFunctions ??
                defaultSettings.codeLens.showParentTraitFunctions,
        },
        inspections: {
            disabled: vsSettings.inspections?.disabled ?? defaultSettings.inspections.disabled,
        },
        documentation: {
            showTlb: vsSettings.documentation?.showTlb ?? defaultSettings.documentation.showTlb,
            showKeywordDocumentation:
                vsSettings.documentation?.showKeywordDocumentation ??
                defaultSettings.documentation.showKeywordDocumentation,
            maximumLinesBodyToShowInDocumentation:
                vsSettings.documentation?.maximumLinesBodyToShowInDocumentation ??
                defaultSettings.documentation.maximumLinesBodyToShowInDocumentation,
            showNumbersInDifferentNumberSystems:
                vsSettings.documentation?.showNumbersInDifferentNumberSystems ??
                defaultSettings.documentation.showNumbersInDifferentNumberSystems,
        },
        fift: {
            hints: {
                showGasConsumption:
                    vsSettings.fift?.hints.showGasConsumption ??
                    defaultSettings.fift.hints.showGasConsumption,
            },
            semanticHighlighting: {
                enabled:
                    vsSettings.fift?.semanticHighlighting.enabled ??
                    defaultSettings.fift.semanticHighlighting.enabled,
            },
        },
        completion: {
            typeAware: vsSettings.completion?.typeAware ?? defaultSettings.completion.typeAware,
            addImports: vsSettings.completion?.addImports ?? defaultSettings.completion.addImports,
        },
        documentSymbols: {
            showStructFields:
                vsSettings.documentSymbols?.showStructFields ??
                defaultSettings.documentSymbols.showStructFields,
            showMessageFields:
                vsSettings.documentSymbols?.showMessageFields ??
                defaultSettings.documentSymbols.showMessageFields,
        },
        linters: {
            compiler: {
                enable:
                    vsSettings.linters?.compiler.enable ?? defaultSettings.linters.compiler.enable,
            },
            misti: {
                enable: vsSettings.linters?.misti.enable ?? defaultSettings.linters.misti.enable,
                binPath: vsSettings.linters?.misti.binPath ?? defaultSettings.linters.misti.binPath,
            },
            useProblemMatcher:
                vsSettings.linters?.useProblemMatcher ?? defaultSettings.linters.useProblemMatcher,
        },
    }
}

export async function getDocumentSettings(resource: string): Promise<TactSettings> {
    let vsCodeSettings = documentSettings.get(resource)
    if (!vsCodeSettings) {
        vsCodeSettings = (await connection.workspace.getConfiguration({
            scopeUri: resource,
            section: "tact",
        })) as TactSettings | undefined
        if (vsCodeSettings) {
            documentSettings.set(resource, vsCodeSettings)
        }
    }
    if (!vsCodeSettings) {
        return defaultSettings
    }

    return mergeSettings(vsCodeSettings)
}

export function clearDocumentSettings(): void {
    documentSettings.clear()
}
