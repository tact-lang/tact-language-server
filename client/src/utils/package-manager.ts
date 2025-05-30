//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import * as vscode from "vscode"

export type PackageManager = "yarn" | "npm" | "pnpm" | "bun"

export async function detectPackageManager(): Promise<PackageManager> {
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (!workspaceFolders || workspaceFolders.length === 0) return "npm"

    const workspaceRoot = workspaceFolders[0].uri

    // Check for lock files
    if (await pathExits(workspaceRoot, "bun.lockb")) {
        return "bun"
    }
    if (await pathExits(workspaceRoot, "yarn.lock")) {
        return "yarn"
    }
    if (await pathExits(workspaceRoot, "pnpm-lock.yaml")) {
        return "pnpm"
    }
    if (await pathExits(workspaceRoot, "package-lock.json")) {
        return "npm"
    }

    try {
        const packageJsonContent = await vscode.workspace.fs.readFile(
            vscode.Uri.joinPath(workspaceFolders[0].uri, "package.json"),
        )
        const packageJson = JSON.parse(new TextDecoder().decode(packageJsonContent)) as {
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

async function pathExits(path: vscode.Uri, file: string): Promise<boolean> {
    try {
        await vscode.workspace.fs.stat(vscode.Uri.joinPath(path, file))
        return true
    } catch {
        return false
    }
}
