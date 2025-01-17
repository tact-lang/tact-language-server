import * as vscode from "vscode"

export async function activate(): Promise<void> {
    console.log("Activating extension...")

    const ext = vscode.extensions.getExtension("ton-core.tact-vscode")
    if (!ext) {
        throw new Error(
            "Extension not found. Make sure the extension is installed and the ID is correct (ton-core.tact-vscode)",
        )
    }

    console.log("Extension found, activating...")
    await ext.activate()

    console.log("Waiting for language server initialization...")
    await new Promise(resolve => setTimeout(resolve, 2000))

    const languages = await vscode.languages.getLanguages()
    if (!languages.includes("tact")) {
        const packageJson = ext.packageJSON
        console.log("Extension contributes:", packageJson.contributes)
        throw new Error("Tact language not registered. Check package.json configuration.")
    }

    if (!ext.isActive) {
        throw new Error("Extension failed to activate")
    }

    const tactConfiguration = vscode.workspace.getConfiguration("tact")
    console.log("Tact configuration:", tactConfiguration)

    console.log("Extension activated successfully")
}
