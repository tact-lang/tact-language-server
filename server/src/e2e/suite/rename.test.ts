import * as vscode from "vscode"
import * as assert from "assert"
import {BaseTestSuite} from "./BaseTestSuite"
import {TestCase} from "./TestParser"

interface RenamePosition {
    line: number
    character: number
    renameTo: string
}

suite("Rename Test Suite", () => {
    const testSuite = new (class extends BaseTestSuite {
        findRenamePositions(input: string): RenamePosition[] {
            const positions: RenamePosition[] = []
            const lines = input.split("\n")

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i]
                if (line.includes("//!")) {
                    const caretPosition = line.indexOf("^")

                    const character = caretPosition
                    const renameTo = line.substring(caretPosition + 1).trim()

                    positions.push({
                        line: i - 1,
                        character: character,
                        renameTo,
                    })
                }
            }
            return positions
        }

        async renameTo(position: vscode.Position, newName: string) {
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

        protected runTest(testFile: string, testCase: TestCase) {
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
        this.timeout(10000)
        await testSuite.suiteSetup()
    })

    setup(() => testSuite.setup())
    teardown(() => testSuite.teardown())
    suiteTeardown(() => testSuite.suiteTeardown())

    testSuite.runTestsFromDirectory("rename")
})
