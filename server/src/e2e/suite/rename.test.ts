import * as vscode from "vscode"
import * as assert from "node:assert"
import {BaseTestSuite} from "./BaseTestSuite"
import type {TestCase} from "./TestParser"

interface RenamePosition {
    readonly line: number
    readonly character: number
    readonly renameTo: string
}

suite("Rename Test Suite", () => {
    const testSuite = new (class extends BaseTestSuite {
        private findRenamePositions(input: string): RenamePosition[] {
            const positions: RenamePosition[] = []
            const lines = input.split("\n")

            lines.forEach((line, i) => {
                if (line.includes("//!")) {
                    const caretPosition = line.indexOf("^")

                    const character = caretPosition
                    const renameTo = line.slice(caretPosition + 1).trim()

                    positions.push({
                        line: i - 1,
                        character: character,
                        renameTo,
                    })
                }
            })
            return positions
        }

        private async renameTo(position: vscode.Position, newName: string): Promise<void> {
            const result = await vscode.commands.executeCommand<vscode.WorkspaceEdit | undefined>(
                "vscode.executeDocumentRenameProvider",
                this.document.uri,
                position,
                newName,
            )

            if (result) {
                await vscode.workspace.applyEdit(result)
            }
        }

        protected runTest(testFile: string, testCase: TestCase): void {
            test(`Rename: ${testCase.name}`, async () => {
                const positions = this.findRenamePositions(testCase.input)

                await this.replaceDocumentText(testCase.input)

                for (const pos of positions) {
                    const params = new vscode.Position(pos.line, pos.character)
                    await this.renameTo(params, pos.renameTo)
                }

                const actual = this.document.getText()

                if (BaseTestSuite.UPDATE_SNAPSHOTS) {
                    this.updates.push({
                        filePath: testFile,
                        testName: testCase.name,
                        actual,
                    })
                } else {
                    assert.strictEqual(actual, testCase.expected)
                }
            })
        }
    })()

    suiteSetup(async function () {
        this.timeout(10_000)
        await testSuite.suiteSetup()
    })

    setup(async () => testSuite.setup())
    teardown(async () => testSuite.teardown())
    suiteTeardown(() => testSuite.suiteTeardown())

    testSuite.runTestsFromDirectory("rename")
})
