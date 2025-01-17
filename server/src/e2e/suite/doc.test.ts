import * as vscode from "vscode"
import * as assert from "assert"
import {BaseTestSuite} from "./BaseTestSuite"
import * as lsp from "vscode-languageserver"

suite("Documentation Test Suite", () => {
    const testSuite = new (class extends BaseTestSuite {
        async getHover(input: string): Promise<lsp.Hover[] | undefined> {
            const caretIndex = input.indexOf("<caret>")
            if (caretIndex === -1) {
                throw new Error("No <caret> marker found in input")
            }

            const textWithoutCaret = input.replace("<caret>", "")
            await this.replaceDocumentText(textWithoutCaret)
            const position = this.calculatePosition(input, caretIndex)
            this.editor.selection = new vscode.Selection(position, position)
            this.editor.revealRange(new vscode.Range(position, position))

            // await new Promise(resolve => setTimeout(resolve, 50000))

            return vscode.commands.executeCommand<lsp.Hover[]>(
                "vscode.executeHoverProvider",
                this.document.uri,
                position,
            )
        }

        formatDocumentation(hover?: lsp.Hover[]): string {
            if (!hover) return "no documentation"
            console.log("hover", hover)
            console.log("hover", (hover[0].contents as lsp.MarkedString[])[0])
            console.log("hover", hover[0].range)
            return ""
        }

        protected runTest(testFile: string, testCase: any) {
            test(`Documentation: ${testCase.name}`, async () => {
                const hover = await this.getHover(testCase.input)
                const actual = this.formatDocumentation(hover)

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
