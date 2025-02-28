import * as vscode from "vscode"
import * as assert from "node:assert"
import {BaseTestSuite} from "./BaseTestSuite"
import type {TestCase} from "./TestParser"
import {CompletionItem} from "vscode"
import * as path from "node:path"

suite("Completion Test Suite", () => {
    const testSuite = new (class extends BaseTestSuite {
        public async getCompletions(
            input: string,
            triggerCharacter?: string,
        ): Promise<CompletionItem[]> {
            const textWithoutCaret = input.replace("<caret>", "")
            await this.replaceDocumentText(textWithoutCaret)

            const caretIndex = input.indexOf("<caret>")
            if (caretIndex === -1) {
                throw new Error("No <caret> marker found in input")
            }

            const position = this.document.positionAt(caretIndex)
            this.editor.selection = new vscode.Selection(position, position)
            this.editor.revealRange(new vscode.Range(position, position))

            const items = await vscode.commands.executeCommand<vscode.CompletionList>(
                "vscode.executeCompletionItemProvider",
                this.document.uri,
                position,
                triggerCharacter,
            )
            if (items.items.length > 100) {
                return items.items.slice(0, 100)
            }
            return items.items
        }

        protected runTest(testFile: string, testCase: TestCase): void {
            test(`Completion: ${testCase.name}`, async () => {
                if (testFile.includes("import")) {
                    await this.openFile("other.tact", "")
                }

                const completions = await this.getCompletions(testCase.input, ".")

                const items = completions
                    .filter(item => Number(item.kind) !== 0)
                    .map(item => {
                        const label = typeof item.label === "object" ? item.label.label : item.label
                        const details =
                            (typeof item.label === "object" ? item.label.detail : item.detail) ?? ""
                        const description =
                            typeof item.label === "object" && item.label.description
                                ? `  ${item.label.description}`
                                : ""

                        return `${item.kind?.toString().padEnd(2)} ${label}${details}${description}`.trimEnd()
                    })

                const expected = testCase.expected.trimEnd()
                const actual = items.length > 0 ? items.join("\n") : "No completion items"

                if (BaseTestSuite.UPDATE_SNAPSHOTS) {
                    this.updates.push({
                        filePath: testFile,
                        testName: testCase.name,
                        actual: actual,
                    })
                } else {
                    assert.deepStrictEqual(actual, expected)
                }

                if (testFile.includes("import")) {
                    const filePath = path.join(this.workingDir(), "other.tact")
                    await this.closeFile(filePath)
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

    testSuite.runTestsFromDirectory("completion")
})
