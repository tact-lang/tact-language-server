import {connection} from "@server/connection"

export interface TactSettings {
    stdlib: {
        path: string | null
    }
    hints: {
        types: boolean
        parameters: boolean
        exitCodeFormat: "decimal" | "hex"
        showMethodId: boolean
    }
    codeLens: {
        enabled: boolean
    }
    completion: {
        typeAware: boolean
    }
}

const defaultSettings: TactSettings = {
    stdlib: {
        path: null,
    },
    hints: {
        types: true,
        parameters: true,
        exitCodeFormat: "decimal",
        showMethodId: true,
    },
    codeLens: {
        enabled: true,
    },
    completion: {
        typeAware: true,
    },
}

const documentSettings = new Map<string, TactSettings>()

function mergeSettings(vsSettings: Partial<TactSettings>): TactSettings {
    return {
        stdlib: {
            path: vsSettings.stdlib?.path ?? defaultSettings.stdlib.path,
        },
        hints: {
            types: vsSettings.hints?.types ?? defaultSettings.hints.types,
            parameters: vsSettings.hints?.parameters ?? defaultSettings.hints.parameters,
            exitCodeFormat:
                vsSettings.hints?.exitCodeFormat ?? defaultSettings.hints.exitCodeFormat,
            showMethodId: vsSettings.hints?.showMethodId ?? defaultSettings.hints.showMethodId,
        },
        codeLens: {
            enabled: vsSettings.codeLens?.enabled ?? defaultSettings.codeLens.enabled,
        },
        completion: {
            typeAware: vsSettings.completion?.typeAware ?? defaultSettings.completion.typeAware,
        },
    }
}

export async function getDocumentSettings(resource: string): Promise<TactSettings> {
    let vsCodeSettings = documentSettings.get(resource)
    if (!vsCodeSettings) {
        vsCodeSettings = await connection.workspace.getConfiguration({
            scopeUri: resource,
            section: "tact",
        })
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
