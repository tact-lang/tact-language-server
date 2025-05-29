//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import * as vscode from "vscode"
import * as assert from "node:assert"
import {BaseTestSuite} from "./BaseTestSuite"
import type {TestCase} from "./TestParser"

suite("Code Lenses Test Suite", () => {
    const testSuite = new (class extends BaseTestSuite {
        public async getCodeLenses(input: string): Promise<vscode.CodeLens[]> {
            await this.replaceDocumentText(input)
            return vscode.commands.executeCommand<vscode.CodeLens[]>(
                "vscode.executeCodeLensProvider",
                this.document.uri,
            )
        }

        protected runTest(testFile: string, testCase: TestCase): void {
            test(`CodeLens: ${testCase.name}`, async () => {
                await this.replaceDocumentText(testCase.input)
                const codeLenses = await this.getCodeLenses(this.document.getText())

                codeLenses.sort((a, b) => {
                    if (a.range.start.line !== b.range.start.line) {
                        return a.range.start.line - b.range.start.line
                    }
                    return a.range.start.character - b.range.start.character
                })

                for (let x = 0; x < codeLenses.length; x++) {
                    const codeLens = codeLenses[x]

                    const title = codeLens.command?.title ?? "No command"
                    const value = `/* ${title} */`

                    await this.editor.edit(editBuilder => {
                        editBuilder.insert(codeLens.range.start, value)
                    })

                    const updatedCodeLenses = await this.getCodeLenses(this.document.getText())

                    for (
                        let y = x + 1;
                        y < codeLenses.length && y < updatedCodeLenses.length;
                        y++
                    ) {
                        codeLenses[y].range = updatedCodeLenses[y].range
                    }
                }

                const expected = testCase.expected.trimEnd()
                const actual = this.document.getText().trimEnd().replace(/\r\n/g, "\n")
                if (BaseTestSuite.UPDATE_SNAPSHOTS) {
                    this.updates.push({
                        filePath: testFile,
                        testName: testCase.name,
                        actual: actual,
                    })
                } else {
                    assert.deepStrictEqual(actual, expected)
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

    testSuite.runTestsFromDirectory("codeLenses")
})
