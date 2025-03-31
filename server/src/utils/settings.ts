import {connection} from "@server/connection"

export type FindUsagesScope = "workspace" | "everywhere"

export interface TactSettings {
    stdlib: {
        path: string | null
    }
    toolchain: {
        compilerPath: string
        showShortCommitInStatusBar: boolean
    }
    highlighting: {
        highlightCodeInComments: boolean
    }
    findUsages: {
        scope: FindUsagesScope
    }
    hints: {
        disable: boolean
        types: boolean
        parameters: boolean
        exitCodeFormat: "decimal" | "hex"
        showMethodId: boolean
        showGasConsumption: boolean
        showAsmInstructionGas: boolean
        showExitCodes: boolean
        showExplicitTLBIntType: boolean
        gasFormat: string
        showContinuationGas: boolean
        showToCellSize: boolean
        showAsciiEvaluationResult: boolean
        showCrc32EvaluationResult: boolean
    }
    gas: {
        loopGasCoefficient: number
    }
    codeLens: {
        enabled: boolean
        showUsages: boolean
        showOverrides: boolean
        showTraitImplementations: boolean
        showFunctionImplementations: boolean
        showParentTraitFields: boolean
        showParentTraitFunctions: boolean
    }
    inspections: {
        disabled: string[] // list of disabled inspection ids
    }
    fift: {
        hints: {
            showGasConsumption: boolean
        }
        semanticHighlighting: {
            enabled: boolean
        }
    }
    completion: {
        typeAware: boolean
        addImports: boolean
    }
    documentSymbols: {
        showStructFields: boolean
        showMessageFields: boolean
    }
    linters: {
        compiler: {
            enable: boolean
        }
        misti: {
            enable: boolean
            binPath: string
        }
        useProblemMatcher: boolean
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
        compilerPath: "",
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
            enable: false,
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
            compilerPath:
                vsSettings.toolchain?.compilerPath ?? defaultSettings.toolchain.compilerPath,
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
