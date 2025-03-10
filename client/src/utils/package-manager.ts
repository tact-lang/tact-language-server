import * as vscode from "vscode"
import * as fs from "node:fs"
import * as path from "node:path"

export type PackageManager = "yarn" | "npm" | "pnpm" | "bun"

export function detectPackageManager(): PackageManager {
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (!workspaceFolders || workspaceFolders.length === 0) return "npm"

    const workspaceRoot = workspaceFolders[0].uri.fsPath

    // Check for lock files
    if (fs.existsSync(path.join(workspaceRoot, "bun.lockb"))) {
        return "bun"
    }
    if (fs.existsSync(path.join(workspaceRoot, "yarn.lock"))) {
        return "yarn"
    }
    if (fs.existsSync(path.join(workspaceRoot, "pnpm-lock.yaml"))) {
        return "pnpm"
    }
    if (fs.existsSync(path.join(workspaceRoot, "package-lock.json"))) {
        return "npm"
    }

    try {
        const packageJsonPath = path.join(workspaceRoot, "package.json")
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as {
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
