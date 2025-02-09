import * as vscode from "vscode"
import * as assert from "assert"
import {BaseTestSuite} from "./BaseTestSuite"
import {TestCase} from "./TestParser"

suite("Intentions Test Suite", () => {
    const testSuite = new (class extends BaseTestSuite {
        async getCodeActions(input: string): Promise<vscode.CodeAction[]> {
            const textWithoutCaret = input.replace("<caret>", "")
            await this.replaceDocumentText(textWithoutCaret)

            const caretIndex = input.indexOf("<caret>")
            if (caretIndex === -1) {
                throw new Error("No <caret> marker found in input")
            }

            const position = this.document.positionAt(caretIndex)
            const range = new vscode.Range(position, position)

            return vscode.commands.executeCommand<vscode.CodeAction[]>(
                "vscode.executeCodeActionProvider",
                this.document.uri,
                range,
            )
        }

        protected runTest(testFile: string, testCase: TestCase) {
            test(`Intention: ${testCase.name}`, async () => {
                const actions = await this.getCodeActions(testCase.input)

                if (actions.length === 0) {
                    if (BaseTestSuite.UPDATE_SNAPSHOTS) {
                        this.updates.push({
                            filePath: testFile,
                            testName: testCase.name,
                            actual: "No intentions",
                        })
                    } else {
                        assert.strictEqual(actions.length, 0, "No intentions")
                    }
                    return
                }

                assert.ok(actions.length > 0, "No code actions available")

                const command = actions[0].command
                if (!command || !command.arguments) throw new Error("No intention command")

                await vscode.commands.executeCommand(
                    command.command,
                    command.arguments[0] as unknown,
                )

                const resultText = this.editor.document.getText()
                const expected = testCase.expected.trim()

                if (BaseTestSuite.UPDATE_SNAPSHOTS) {
                    this.updates.push({
                        filePath: testFile,
                        testName: testCase.name,
                        actual: resultText,
                    })
                } else {
                    assert.strictEqual(resultText.trim(), expected)
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

    testSuite.runTestsFromDirectory("intentions")
})
