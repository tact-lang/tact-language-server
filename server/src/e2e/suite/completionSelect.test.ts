import * as vscode from "vscode"
import * as assert from "node:assert"
import {BaseTestSuite} from "./BaseTestSuite"
import type {TestCase} from "./TestParser"
import {CompletionItem} from "vscode"

suite("Completion Test Suite", () => {
    const testSuite = new (class extends BaseTestSuite {
        public async getFilteredCompletion(input: string): Promise<CompletionItem> {
            const textWithoutCaret = input.replace("<caret>", "")
            await this.replaceDocumentText(textWithoutCaret)

            const caretIndex = input.indexOf("<caret>")
            if (caretIndex === -1) {
                throw new Error("No <caret> marker found in input")
            }

            const position = this.document.positionAt(caretIndex)
            this.editor.selection = new vscode.Selection(position, position)
            this.editor.revealRange(new vscode.Range(position, position))

            const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
                "vscode.executeCompletionItemProvider",
                this.document.uri,
                position,
            )

            const line = this.document.lineAt(position.line)
            const textBeforeCursor = line.text.slice(0, position.character)
            // Filtering items to match better completion for this test
            let items = completions.items.filter(item => {
                const label = typeof item.label === "object" ? item.label.label : item.label
                return label.includes(textBeforeCursor.trim())
            })

            if (completions.items.length <= 0) {
                throw new Error("No completions available for this test")
            }

            if (items.length <= 0) {
                items = completions.items
            }

            return items[0]
        }

        public async applyCompletionItem(completionItem: vscode.CompletionItem): Promise<void> {
            if (
                completionItem.insertText instanceof vscode.SnippetString &&
                completionItem.range !== undefined &&
                "inserting" in completionItem.range &&
                "replacing" in completionItem.range
            ) {
                await this.editor.insertSnippet(
                    completionItem.insertText,
                    completionItem.range.replacing,
                )
            }

            // If completion doesn't have a snippet
            if (
                typeof completionItem.insertText === "string" &&
                completionItem.range !== undefined &&
                "inserting" in completionItem.range &&
                "replacing" in completionItem.range
            ) {
                const cursorPosition = this.editor.selection.active
                const textToInsert: string = completionItem.insertText
                await this.editor.edit(builder => {
                    builder.insert(cursorPosition, textToInsert)
                })
            }
        }

        protected runTest(testFile: string, testCase: TestCase): void {
            test(`Completion Select: ${testCase.name}`, async () => {
                const completion = await this.getFilteredCompletion(testCase.input)
                await this.applyCompletionItem(completion)
                const editorText = this.document.getText()
                const expected = testCase.expected

                if (BaseTestSuite.UPDATE_SNAPSHOTS) {
                    this.updates.push({
                        filePath: testFile,
                        testName: testCase.name,
                        actual: editorText,
                    })
                } else {
                    assert.deepStrictEqual(editorText, expected)
                }
            })
        }
    })()

    suiteSetup(async function () {
        this.timeout(60_000)
        await testSuite.suiteSetup()
    })

    setup(async () => testSuite.setup())
    teardown(async () => testSuite.teardown())
    suiteTeardown(() => testSuite.suiteTeardown())

    testSuite.runTestsFromDirectory("completionSelect")
})
