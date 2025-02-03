import * as vscode from "vscode"
import * as assert from "assert"
import {BaseTestSuite} from "./BaseTestSuite"
import * as lsp from "vscode-languageserver"
import {GetTypeAtPositionParams} from "./types.test"
import {TestCase} from "./TestParser"

suite("Documentation Test Suite", () => {
    const testSuite = new (class extends BaseTestSuite {
        async getHovers(input: string): Promise<(lsp.Hover | undefined)[]> {
            const caretIndexes = this.findCaretPositions(input)
            if (caretIndexes.length == 0) {
                throw new Error("No <caret> marker found in input")
            }

            const textWithoutCaret = input.replace(/<caret>/g, "")
            await this.replaceDocumentText(textWithoutCaret)

            return await Promise.all(
                caretIndexes.map(caretIndex => {
                    const position = this.calculatePosition(input, caretIndex)
                    return this.getHover(position)
                }),
            )
        }

        async getHover(position: vscode.Position): Promise<lsp.Hover | undefined> {
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

        formatDocumentation(hover?: lsp.Hover): string {
            if (!hover) return "no documentation"
            return (hover.contents as lsp.MarkupContent).value
        }

        protected runTest(testFile: string, testCase: TestCase) {
            test(`Documentation: ${testCase.name}`, async () => {
                const hovers = await this.getHovers(testCase.input)
                const actual = hovers.map(hover => this.formatDocumentation(hover)).join("\n")

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

    testSuite.runTestsFromDirectory("documentation")
})
