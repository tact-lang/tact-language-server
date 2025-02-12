import * as vscode from "vscode"
import * as assert from "node:assert"
import {BaseTestSuite} from "./BaseTestSuite"
import type * as lsp from "vscode-languageserver"
import type {GetTypeAtPositionParams} from "./types.test"
import type {TestCase} from "./TestParser"

suite("Documentation Test Suite", () => {
    const testSuite = new (class extends BaseTestSuite {
        public async getHovers(input: string): Promise<(lsp.Hover | undefined)[]> {
            const caretIndexes = this.findCaretPositions(input)
            if (caretIndexes.length === 0) {
                throw new Error("No <caret> marker found in input")
            }

            const textWithoutCaret = input.replace(/<caret>/g, "")
            await this.replaceDocumentText(textWithoutCaret)

            return Promise.all(
                caretIndexes.map(async caretIndex => {
                    const position = this.calculatePosition(input, caretIndex)
                    return this.getHover(position)
                }),
            )
        }

        public async getHover(position: vscode.Position): Promise<lsp.Hover | undefined> {
            return vscode.commands.executeCommand<lsp.Hover>("tact/executeHoverProvider", {
                textDocument: {
                    uri: this.document.uri.toString(),
                },
                position: {
                    line: position.line,
                    character: position.character,
                },
            } as GetTypeAtPositionParams)
        }

        private formatDocumentation(hover?: lsp.Hover): string {
            if (!hover) return "no documentation"
            return (hover.contents as lsp.MarkupContent).value.trimEnd()
        }

        protected runTest(testFile: string, testCase: TestCase): void {
            test(`Documentation: ${testCase.name}`, async () => {
                const hovers = await this.getHovers(testCase.input)
                const actual = hovers
                    .map(hover => this.formatDocumentation(hover))
                    .join("\n")
                    .trimEnd()

                if (BaseTestSuite.UPDATE_SNAPSHOTS) {
                    this.updates.push({
                        filePath: testFile,
                        testName: testCase.name,
                        actual,
                    })
                } else {
                    assert.strictEqual(actual, testCase.expected.trimEnd())
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

    testSuite.runTestsFromDirectory("documentation")
})
