import * as path from "path"
import {runTests} from "@vscode/test-electron"

async function main() {
    try {
        const extensionDevelopmentPath = path.resolve(__dirname, "../../../")
        const extensionTestsPath = path.resolve(__dirname, "./out/suite/index.js")
        const testWorkspace = path.resolve(__dirname, "../../../test-workspace")

        await runTests({
            extensionDevelopmentPath,
            extensionTestsPath,
            launchArgs: [testWorkspace],
        })
    } catch (err) {
        console.error("Failed to run tests:", err)
        process.exit(1)
    }
}

void main()
