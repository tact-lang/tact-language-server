import * as vscode from "vscode"
import * as fs from "node:fs"
import * as path from "node:path"

export function registerCreateTactProjectCommand(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.commands.registerCommand("tact.createProject", async () => {
            const projectName = await vscode.window.showInputBox({
                prompt: "Enter project name",
                placeHolder: "my-tact-project",
                validateInput: value => {
                    if (!value) {
                        return "Project name cannot be empty"
                    }
                    if (!/^[\w-]+$/.test(value)) {
                        return "Project name can only contain letters, numbers, hyphens and underscores"
                    }
                    return null
                },
            })

            if (!projectName) {
                return
            }

            const workspaceFolder = await vscode.window.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
            })

            if (!workspaceFolder || workspaceFolder.length === 0) {
                return
            }

            const projectPath = path.join(workspaceFolder[0].fsPath, projectName)

            try {
                fs.mkdirSync(projectPath)

                const contractContent = `contract Contract {
    owner: Address;

    init(owner: Address) {
        self.owner = owner;
    }

    receive() {
        // Handle incoming messages
    }

    get fun owner(): Address {
        return self.owner;
    }
}
`

                fs.writeFileSync(path.join(projectPath, "contract.tact"), contractContent)

                await vscode.commands.executeCommand(
                    "vscode.openFolder",
                    vscode.Uri.file(projectPath),
                )

                vscode.window.showInformationMessage(
                    `Successfully created Tact project: ${projectName}`,
                )
            } catch (error: unknown) {
                // @ts-expect-error error is unknown
                vscode.window.showErrorMessage(`Failed to create project: ${error.message}`)
            }
        }),
    )
}
