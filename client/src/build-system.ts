import * as vscode from "vscode"
import * as fs from "node:fs"
import * as path from "node:path"

interface TaskProviderBase extends vscode.TaskProvider {
    createBuildTask(): vscode.Task

    isAvailable(): boolean

    readonly taskType: string
}

export class BlueprintTaskProvider implements TaskProviderBase {
    private static readonly TaskType: string = "blueprint"
    public readonly taskType: string = BlueprintTaskProvider.TaskType
    private tasks: vscode.Task[] | undefined

    public provideTasks(): vscode.Task[] {
        const isAvailable = this.isAvailable()
        if (!isAvailable) return []

        if (this.tasks) {
            return this.tasks
        }

        this.tasks = [this.createBuildTask()]
        return this.tasks
    }

    public isAvailable(): boolean {
        return projectUsesBlueprint()
    }

    public resolveTask(task: vscode.Task): vscode.Task | undefined {
        const def = task.definition
        if (def.type === BlueprintTaskProvider.TaskType) {
            return this.createBuildTask()
        }
        return undefined
    }

    public createBuildTask(): vscode.Task {
        const definition = {
            type: BlueprintTaskProvider.TaskType,
            script: "build",
        }

        const execution = new vscode.ShellExecution("npx blueprint build")
        const task = new vscode.Task(
            definition,
            vscode.TaskScope.Workspace,
            "build",
            "Blueprint",
            execution,
        )

        task.group = vscode.TaskGroup.Build
        task.presentationOptions = {
            reveal: vscode.TaskRevealKind.Always,
            panel: vscode.TaskPanelKind.New,
        }

        return task
    }
}

export class TactTemplateTaskProvider implements TaskProviderBase {
    private static readonly TaskType: string = "tact-template"
    public readonly taskType: string = TactTemplateTaskProvider.TaskType
    private tasks: vscode.Task[] | undefined

    public isAvailable(): boolean {
        return !projectUsesBlueprint()
    }

    public provideTasks(): vscode.Task[] {
        const isAvailable = this.isAvailable()
        if (!isAvailable) return []

        if (this.tasks) {
            return this.tasks
        }

        this.tasks = [this.createBuildTask()]
        return this.tasks
    }

    public resolveTask(task: vscode.Task): vscode.Task | undefined {
        const def = task.definition
        if (def.type === TactTemplateTaskProvider.TaskType) {
            return this.createBuildTask()
        }
        return undefined
    }

    public createBuildTask(): vscode.Task {
        const definition = {
            type: TactTemplateTaskProvider.TaskType,
            script: "build",
        }

        const execution = new vscode.ShellExecution("yarn build")
        const task = new vscode.Task(
            definition,
            vscode.TaskScope.Workspace,
            "build",
            "Tact Template",
            execution,
        )

        task.group = vscode.TaskGroup.Build
        task.presentationOptions = {
            reveal: vscode.TaskRevealKind.Always,
            panel: vscode.TaskPanelKind.New,
        }

        return task
    }
}

function registerTaskProvider(context: vscode.ExtensionContext, provider: TaskProviderBase): void {
    if (provider.isAvailable()) {
        const taskProviderDisposable = vscode.tasks.registerTaskProvider(
            provider.taskType,
            provider,
        )
        context.subscriptions.push(taskProviderDisposable)
    }
}

export function registerBuildTasks(context: vscode.ExtensionContext): void {
    const blueprintProvider = new BlueprintTaskProvider()
    const tactTemplateProvider = new TactTemplateTaskProvider()

    registerTaskProvider(context, blueprintProvider)
    registerTaskProvider(context, tactTemplateProvider)

    context.subscriptions.push(
        vscode.commands.registerCommand("tact.build", async () => {
            const tasks = await vscode.tasks.fetchTasks()

            const buildTask = tasks.find(
                task =>
                    task.group === vscode.TaskGroup.Build &&
                    (task.source === "Blueprint" || task.source === "Tact Template"),
            )

            if (buildTask) {
                await vscode.tasks.executeTask(buildTask)
            } else {
                void vscode.window.showErrorMessage("Build task not found")
            }
        }),
    )
}

function projectUsesBlueprint(): boolean {
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (!workspaceFolders) return false

    const packageJsonPath = path.join(workspaceFolders[0].uri.fsPath, "package.json")

    try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as {
            dependencies?: Record<string, unknown>
            devDependencies?: Record<string, unknown>
        }
        return (
            packageJson.dependencies?.["@ton/blueprint"] !== undefined ||
            packageJson.devDependencies?.["@ton/blueprint"] !== undefined
        )
    } catch {
        // ignore any errors
    }

    return false
}
