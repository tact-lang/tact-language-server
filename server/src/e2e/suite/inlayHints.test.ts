import * as vscode from "vscode"
import * as assert from "node:assert"
import {BaseTestSuite} from "./BaseTestSuite"
import type {TestCase} from "./TestParser"

suite("Inlay Hints Test Suite", () => {
    const testSuite = new (class extends BaseTestSuite {
        public async getHints(input: string): Promise<vscode.InlayHint[]> {
            await this.replaceDocumentText(input)
            return vscode.commands.executeCommand<vscode.InlayHint[]>(
                "vscode.executeInlayHintProvider",
                this.document.uri,
                new vscode.Range(
                    this.document.positionAt(0),
                    this.document.positionAt(input.length),
                ),
            )
        }

        protected runTest(testFile: string, testCase: TestCase): void {
            test(`Hint: ${testCase.name}`, async () => {
                const initialHints = await this.getHints(testCase.input)
                const expected = testCase.expected.split("\n").filter((line: string) => line !== "")
                await this.replaceDocumentText(testCase.input)

                for (const hint of initialHints) {
                    await this.editor.edit(editBuilder => {
                        if (typeof hint.label === "string") {
                            editBuilder.insert(hint.position, `/* ${hint.label} */`)
                        }
                    })

                    const updatedHints = await this.getHints(this.document.getText())

                    initialHints.forEach((h, index) => {
                        h.position = updatedHints[index].position
                    })
                }

                if (BaseTestSuite.UPDATE_SNAPSHOTS) {
                    this.updates.push({
                        filePath: testFile,
                        testName: testCase.name,
                        actual: this.document.getText(),
                    })
                } else {
                    assert.deepStrictEqual(initialHints, expected)
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

    testSuite.runTestsFromDirectory("inlayHints")
})
