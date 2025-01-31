import * as vscode from "vscode"
import * as assert from "assert"
import {BaseTestSuite} from "./BaseTestSuite"

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

        protected runTest(testFile: string, testCase: any) {
            test(`Completion: ${testCase.name}`, async () => {
                const completions = await this.getCompletions(testCase.input, ".")

                if (testCase.properties["json"] === "true") {
                    const expected = JSON.parse(testCase.expected)
                    const actual = {
                        items: completions.items.map(item => ({
                            label: item.label,
                            kind: vscode.CompletionItemKind[item.kind!],
                            detail: item.detail,
                        })),
                    }

                    if (BaseTestSuite.UPDATE_SNAPSHOTS) {
                        this.updates.push({
                            filePath: testFile,
                            testName: testCase.name,
                            actual: JSON.stringify(actual, null, 4),
                        })
                    } else {
                        assert.deepStrictEqual(actual, expected)
                    }
                } else {
                    const items = completions.items.map(item => {
                        const label = typeof item.label === "object" ? item.label.label : item.label
                        const details =
                            (typeof item.label === "object" ? item.label.detail : item.detail) ?? ""

                        return `${item.kind?.toString()?.padEnd(2)} ${label}${details}`
                    })
                    const expected = testCase.expected
                        .split("\n")
                        .filter((line: string) => line !== "")

                    if (BaseTestSuite.UPDATE_SNAPSHOTS) {
                        this.updates.push({
                            filePath: testFile,
                            testName: testCase.name,
                            actual: items.join("\n"),
                        })
                    } else {
                        assert.deepStrictEqual(items.sort(), expected.sort())
                    }
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
