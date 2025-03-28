import * as vscode from "vscode"
import {fileExists, readFile} from "./fs"

export type PackageManager = "yarn" | "npm" | "pnpm" | "bun"

export async function detectPackageManager(): Promise<PackageManager> {
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (!workspaceFolders || workspaceFolders.length === 0) return "npm"

    const workspaceRoot = workspaceFolders[0].uri

    // Check for lock files
    if (await fileExists(vscode.Uri.joinPath(workspaceRoot, "bun.lockb"))) {
        return "bun"
    }
    if (await fileExists(vscode.Uri.joinPath(workspaceRoot, "yarn.lock"))) {
        return "yarn"
    }
    if (await fileExists(vscode.Uri.joinPath(workspaceRoot, "pnpm-lock.yaml"))) {
        return "pnpm"
    }
    if (await fileExists(vscode.Uri.joinPath(workspaceRoot, "package-lock.json"))) {
        return "npm"
    }

    try {
        const packageJsonUri = vscode.Uri.joinPath(workspaceRoot, "package.json")
        const packageJson = JSON.parse(await readFile(packageJsonUri)) as {
            packageManager?: string
        }

        if (packageJson.packageManager) {
            if (packageJson.packageManager.startsWith("bun")) {
                return "bun"
            }
            if (packageJson.packageManager.startsWith("yarn")) {
                return "yarn"
            }
            if (packageJson.packageManager.startsWith("pnpm")) {
                return "pnpm"
            }
        }
    } catch {
        // ignore any errors
    }

    return "npm"
}
