import {connection} from "@server/connection"

export interface TactSettings {
    stdlib: {
        path: string | null
    }
    hints: {
        types: boolean
        parameters: boolean
    }
    codeLens: {
        enabled: boolean
    }
}

const defaultSettings: TactSettings = {
    stdlib: {
        path: null,
    },
    hints: {
        types: true,
        parameters: true,
    },
    codeLens: {
        enabled: true,
    },
}

const documentSettings = new Map<string, Thenable<TactSettings>>()

function mergeSettings(vsSettings: Partial<TactSettings>): TactSettings {
    return {
        stdlib: {
            path: vsSettings.stdlib?.path ?? defaultSettings.stdlib.path,
        },
        hints: {
            types: vsSettings.hints?.types ?? defaultSettings.hints.types,
            parameters: vsSettings.hints?.parameters ?? defaultSettings.hints.parameters,
        },
        codeLens: {
            enabled: vsSettings.codeLens?.enabled ?? defaultSettings.codeLens.enabled,
        },
    }
}

export async function getDocumentSettings(resource: string): Promise<TactSettings> {
    let vsCodeSettings = documentSettings.get(resource)
    if (!vsCodeSettings) {
        vsCodeSettings = connection.workspace.getConfiguration({
            scopeUri: resource,
            section: "tact",
        })
        documentSettings.set(resource, vsCodeSettings)
    }

    return vsCodeSettings.then(settings => mergeSettings(settings))
}

export function clearDocumentSettings(): void {
    documentSettings.clear()
}
