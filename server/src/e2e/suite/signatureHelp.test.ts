import * as vscode from "vscode"
import * as assert from "node:assert"
import {BaseTestSuite} from "./BaseTestSuite"
import type {TestCase} from "./TestParser"

suite("Signatures Test Suite", () => {
    const testSuite = new (class extends BaseTestSuite {
        public async getSignature(input: string): Promise<vscode.SignatureHelp> {
            await this.editor.edit(builder => {
                const fullRange = new vscode.Range(
                    this.document.lineAt(0).range.start,
                    this.document.lineAt(this.document.lineCount - 1).range.end,
                )
                builder.delete(fullRange)
                builder.insert(this.document.positionAt(0), input)
            })

            const editorText = this.document.getText()
            const caretIndex = editorText.indexOf("<caret>")

            if (caretIndex === -1) {
                throw new Error("No <caret> marker found in input")
            }

            const caretPosition = this.document.positionAt(caretIndex)

            await this.editor.edit(builder => {
                const caretRange = this.document.getWordRangeAtPosition(caretPosition, /<caret>/)
                if (caretRange) {
                    builder.delete(caretRange)
                }
            })

            this.editor.selection = new vscode.Selection(caretPosition, caretPosition)
            this.editor.revealRange(new vscode.Range(caretPosition, caretPosition))

            return vscode.commands.executeCommand<vscode.SignatureHelp>(
                "vscode.executeSignatureHelpProvider",
                this.document.uri,
                caretPosition,
            )
        }

        protected runTest(testFile: string, testCase: TestCase): void {
            test(`Signature: ${testCase.name}`, async () => {
                const signature = await this.getSignature(testCase.input)
                console.log("signature")
                console.log(JSON.stringify(signature))
                const items = signature.signatures.map(item => {
                    const label = item.label
                    if (item.activeParameter !== undefined) {
                        const activeParamLabel = item.parameters[item.activeParameter]?.label ?? ""
                        return `${activeParamLabel.toString()}\n${label}`
                    }
                    return ""
                })
                const expected = testCase.expected.split("\n").filter((line: string) => line !== "")
                if (BaseTestSuite.UPDATE_SNAPSHOTS) {
                    this.updates.push({
                        filePath: testFile,
                        testName: testCase.name,
                        actual: items.join("\n"),
                    })
                } else {
                    assert.deepStrictEqual(items.sort(), expected.sort())
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

    testSuite.runTestsFromDirectory("signatures")
})
