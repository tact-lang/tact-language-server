import * as vscode from "vscode"
import * as assert from "node:assert"
import {BaseTestSuite} from "./BaseTestSuite"
import type {TestCase} from "./TestParser"

suite("Intentions Test Suite", () => {
    const testSuite = new (class extends BaseTestSuite {
        public async getCodeActions(input: string): Promise<vscode.CodeAction[]> {
            const selectionStart = input.indexOf("<selection>")
            const selectionEnd = input.indexOf("</selection>")

            let range: vscode.Range
            let textWithoutMarkers: string

            if (selectionStart !== -1 && selectionEnd !== -1) {
                textWithoutMarkers = input.replace("<selection>", "").replace("</selection>", "")
                await this.replaceDocumentText(textWithoutMarkers)

                const startPos = this.document.positionAt(selectionStart)
                const endPos = this.document.positionAt(selectionEnd - "<selection>".length)
                range = new vscode.Range(startPos, endPos)
            } else {
                textWithoutMarkers = input.replace("<caret>", "")
                await this.replaceDocumentText(textWithoutMarkers)

                const caretIndex = input.indexOf("<caret>")
                if (caretIndex === -1) {
                    throw new Error("No <caret> or <selection> markers found in input")
                }

                const position = this.document.positionAt(caretIndex)
                range = new vscode.Range(position, position)
            }

            return vscode.commands.executeCommand<vscode.CodeAction[]>(
                "vscode.executeCodeActionProvider",
                this.document.uri,
                range,
            )
        }

        protected runTest(testFile: string, testCase: TestCase): void {
            test(`Intention: ${testCase.name}`, async () => {
                if (testFile.includes("Import")) {
                    await this.openFile(
                        "other.tact",
                        `
                            trait ToImport {}

                            trait WithSeveralDeclaration {}
                        `,
                    )
                    await this.openFile(
                        "other2.tact",
                        `
                            trait WithSeveralDeclaration {}
                        `,
                    )
                }

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

                let selectedAction = actions[0]

                const intentionName = testCase.properties.get("intention")
                if (intentionName) {
                    const found = actions.find(action => action.title === intentionName)
                    assert.ok(
                        found,
                        `Intention "${intentionName}" not found. Available intentions: ${actions
                            .map(a => a.title)
                            .join(", ")}`,
                    )
                    selectedAction = found
                }

                const command = selectedAction.command
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

                if (testFile.includes("Import")) {
                    await this.closeFile("other.tact")
                    await this.closeFile("other2.tact")
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

    testSuite.runTestsFromDirectory("intentions")
})
