import * as lsp from "vscode-languageserver"
import {connection} from "@server/connection"
import {getDocumentSettings} from "@server/settings/settings"
import {TactFile} from "@server/languages/tact/psi/TactFile"
import {UnusedParameterInspection} from "@server/languages/tact/inspections/UnusedParameterInspection"
import {EmptyBlockInspection} from "@server/languages/tact/inspections/EmptyBlockInspection"
import {UnusedVariableInspection} from "@server/languages/tact/inspections/UnusedVariableInspection"
import {StructInitializationInspection} from "@server/languages/tact/inspections/StructInitializationInspection"
import {UnusedContractMembersInspection} from "@server/languages/tact/inspections/UnusedContractMembersInspection"
import {UnusedImportInspection} from "@server/languages/tact/inspections/UnusedImportInspection"
import {MissedMembersInContractInspection} from "@server/languages/tact/inspections/MissedMembersInContractInspection"
import {NotImportedSymbolInspection} from "@server/languages/tact/inspections/NotImportedSymbolInspection"
import {DontUseTextReceiversInspection} from "@server/languages/tact/inspections/DontUseTextReceiversInspection"
import {DontUseDeployableInspection} from "@server/languages/tact/inspections/DontUseDeployableInspection"
import {RewriteAsAugmentedAssignment} from "@server/languages/tact/inspections/RewriteAsAugmentedAssignment"
import {CanBeStandaloneFunctionInspection} from "@server/languages/tact/inspections/CanBeStandaloneFunctionInspection"
import {CanBeInlineInspection} from "@server/languages/tact/inspections/CanBeInlineInspection"
import {UseExplicitStringReceiverInspection} from "@server/languages/tact/inspections/UseExplicitStringReceiverInspection"
import {ImplicitReturnValueDiscardInspection} from "@server/languages/tact/inspections/ImplicitReturnValueDiscardInspection"
import {ImplicitMessageId} from "@server/languages/tact/inspections/ImplicitMessageId"
import {RewriteInspection} from "@server/languages/tact/inspections/RewriteInspection"
import {MisspelledKeywordInspection} from "@server/languages/tact/inspections/MisspelledKeywordInspection"
import {DeprecatedSymbolUsageInspection} from "@server/languages/tact/inspections/DeprecatedSymbolUsageInspection"
import {OptimalMathFunctionsInspection} from "@server/languages/tact/inspections/OptimalMathFunctionsInspection"
import {NamingConventionInspection} from "@server/languages/tact/inspections/NamingConventionInspection"
import {CompilerInspection} from "@server/languages/tact/inspections/CompilerInspection"
import {MistiInspection} from "@server/languages/tact/inspections/MistInspection"

export async function runInspections(
    uri: string,
    file: TactFile,
    includeLinters: boolean,
): Promise<void> {
    const inspections = [
        new UnusedParameterInspection(),
        new EmptyBlockInspection(),
        new UnusedVariableInspection(),
        new StructInitializationInspection(),
        new UnusedContractMembersInspection(),
        new UnusedImportInspection(),
        new MissedMembersInContractInspection(),
        new NotImportedSymbolInspection(),
        new DontUseTextReceiversInspection(),
        new DontUseDeployableInspection(),
        new RewriteAsAugmentedAssignment(),
        new CanBeStandaloneFunctionInspection(),
        new CanBeInlineInspection(),
        new UseExplicitStringReceiverInspection(),
        new ImplicitReturnValueDiscardInspection(),
        new ImplicitMessageId(),
        new RewriteInspection(),
        new MisspelledKeywordInspection(),
        new DeprecatedSymbolUsageInspection(),
        new OptimalMathFunctionsInspection(),
        new NamingConventionInspection(),
    ]

    const settings = await getDocumentSettings(uri)
    const diagnostics: lsp.Diagnostic[] = []

    for (const inspection of inspections) {
        if (settings.inspections.disabled.includes(inspection.id)) {
            continue
        }
        diagnostics.push(...inspection.inspect(file))
    }

    if (includeLinters) {
        const asyncInspections = [
            ...(settings.linters.compiler.enable ? [new CompilerInspection()] : []),
            ...(settings.linters.misti.enable ? [new MistiInspection()] : []),
        ]

        for (const inspection of asyncInspections) {
            if (settings.inspections.disabled.includes(inspection.id)) {
                continue
            }

            const allDiagnostics = diagnostics

            void inspection.inspect(file).then(diagnostics => {
                if (diagnostics.length === 0) return
                allDiagnostics.push(...diagnostics)
                void connection.sendDiagnostics({uri, diagnostics: allDiagnostics})
            })
        }
    }

    await connection.sendDiagnostics({uri, diagnostics})
}
