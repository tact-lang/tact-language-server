import * as vscode from "vscode"
import * as assert from "assert"
import {BaseTestSuite} from "./BaseTestSuite"
import {TestCase} from "./TestParser"

suite("Completion Test Suite", () => {
    const testSuite = new (class extends BaseTestSuite {
        async getCompletions(
            input: string,
            triggerCharacter?: string,
        ): Promise<vscode.CompletionList> {
            const textWithoutCaret = input.replace("<caret>", "")
            await this.replaceDocumentText(textWithoutCaret)

            const caretIndex = input.indexOf("<caret>")
            if (caretIndex === -1) {
                throw new Error("No <caret> marker found in input")
            }

            const position = this.document.positionAt(caretIndex)
            this.editor.selection = new vscode.Selection(position, position)
            this.editor.revealRange(new vscode.Range(position, position))

            return vscode.commands.executeCommand<vscode.CompletionList>(
                "vscode.executeCompletionItemProvider",
                this.document.uri,
                position,
                triggerCharacter,
            )
        }

        protected runTest(testFile: string, testCase: TestCase) {
            test(`Completion: ${testCase.name}`, async () => {
                const completions = await this.getCompletions(testCase.input, ".")

                const items = completions.items.map(item => {
                    const label = typeof item.label === "object" ? item.label.label : item.label
                    const details =
                        (typeof item.label === "object" ? item.label.detail : item.detail) ?? ""
                    const description =
                        typeof item.label === "object" && item.label.description
                            ? `  ${item.label.description}`
                            : ""

                    return `${item.kind?.toString().padEnd(2)} ${label}${details}${description}`
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
        this.timeout(10000)
        await testSuite.suiteSetup()
    })

    setup(() => testSuite.setup())
    teardown(() => testSuite.teardown())
    suiteTeardown(() => testSuite.suiteTeardown())

    testSuite.runTestsFromDirectory("completion")
})
