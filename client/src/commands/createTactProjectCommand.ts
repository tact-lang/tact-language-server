import * as vscode from "vscode"
import * as fs from "node:fs"
import * as path from "node:path"
import {spawn} from "child_process"
import {promisify} from "util"

const mkdir = promisify(fs.mkdir)

async function runCommand(command: string, args: string[], cwd: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const process = spawn(command, args, {
            cwd,
            stdio: "inherit",
            shell: true,
        })

        process.on("close", code => {
            if (code === 0) {
                resolve()
            } else {
                reject(new Error(`Command failed with code ${code}`))
            }
        })

        process.on("error", err => {
            reject(err)
        })
    })
}

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

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
                    if (!/^[a-zA-Z0-9-_]+$/.test(value)) {
                        return "Project name can only contain letters, numbers, hyphens and underscores"
                    }
                    return null
                },
            })

            if (!projectName) {
                return
            }

            const template = await vscode.window.showQuickPick(
                [
                    {label: "Blueprint", description: "TON Blueprint template", value: "blueprint"},
                    {label: "Tact Template", description: "Tact template", value: "tact-template"},
                ],
                {
                    placeHolder: "Select project template",
                },
            )

            if (!template) {
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
                if (template.value === "blueprint") {
                    // Create project directory
                    await mkdir(projectPath)

                    // First open the folder
                    await vscode.commands.executeCommand(
                        "vscode.openFolder",
                        vscode.Uri.file(projectPath),
                    )

                    // Wait for the folder to be fully opened
                    await delay(2000)

                    // Get or create terminal
                    let terminal = vscode.window.activeTerminal
                    if (!terminal) {
                        terminal = vscode.window.createTerminal({
                            name: "Blueprint Setup",
                            cwd: projectPath,
                        })
                    }

                    terminal.show()

                    // Wait for terminal to be ready
                    await delay(1000)

                    // Send command to terminal
                    terminal.sendText(`npm init ton@latest ${projectName}`)

                    // Wait for user to complete the setup
                    await new Promise<void>(resolve => {
                        const disposable = vscode.window.onDidCloseTerminal(closedTerminal => {
                            if (closedTerminal === terminal) {
                                disposable.dispose()
                                resolve()
                            }
                        })
                    })

                    // Install dependencies after user completes setup
                    await runCommand("yarn", ["install"], projectPath)
                } else if (template.value === "tact-template") {
                    await vscode.window.withProgress(
                        {
                            location: vscode.ProgressLocation.Notification,
                            title: `Creating Tact project: ${projectName}`,
                            cancellable: false,
                        },
                        async progress => {
                            // Create project directory
                            progress.report({message: "Creating project directory..."})
                            await mkdir(projectPath)

                            progress.report({message: "Cloning Tact template..."})
                            await runCommand(
                                "git",
                                [
                                    "clone",
                                    "https://github.com/tact-lang/tact-template.git",
                                    projectName,
                                ],
                                workspaceFolder[0].fsPath,
                            )

                            // Install dependencies
                            progress.report({message: "Installing dependencies..."})
                            await runCommand("yarn", ["install"], projectPath)
                        },
                    )

                    // Open the new project in VS Code
                    await vscode.commands.executeCommand(
                        "vscode.openFolder",
                        vscode.Uri.file(projectPath),
                    )
                }

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
