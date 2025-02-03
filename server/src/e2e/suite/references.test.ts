import * as vscode from "vscode"
import * as assert from "assert"
import {BaseTestSuite} from "./BaseTestSuite"
import {TextDocumentPositionParams} from "vscode-languageserver"
import {TestCase} from "./TestParser"

suite("References Test Suite", () => {
    const testSuite = new (class extends BaseTestSuite {
        async getReferences(input: string): Promise<[vscode.Location[], string][]> {
            const caretIndexes = this.findCaretPositions(input)
            if (caretIndexes.length == 0) {
                throw new Error("No <caret> marker found in input")
            }

            const textWithoutCaret = input.replace(/<caret>/g, "")
            await this.replaceDocumentText(textWithoutCaret)

            return await Promise.all(
                caretIndexes.map(async caretIndex => {
                    const position = this.calculatePosition(input, caretIndex)
                    const references = await this.getReferencesAt(position)
                    const scope = await this.getScopeAt(position)
                    return [references, scope]
                }),
            )
        }

        async getReferencesAt(position: vscode.Position): Promise<vscode.Location[]> {
            return (
                vscode.commands.executeCommand<vscode.Location[]>(
                    "vscode.executeReferenceProvider",
                    this.document.uri,
                    position,
                ) || []
            )
        }

        async getScopeAt(position: vscode.Position): Promise<string> {
            return vscode.commands.executeCommand<string>("tact/executeGetScopeProvider", {
                textDocument: {
                    uri: this.document.uri.toString(),
                },
                position: {
                    line: position.line,
                    character: position.character,
                },
            } as TextDocumentPositionParams)
        }

        formatLocation(position: vscode.Position): string {
            return `${position.line}:${position.character}`
        }

        formatResult(positions: vscode.Position[], results: [vscode.Location[], string][]): string {
            return positions
                .map((_pos, index) => {
                    const [references, scope] = results[index]
                    const locations = references
                        .map(ref => this.formatLocation(ref.range.start))
                        .join(", ")

                    return `References: [${locations}]\nScope: ${scope}`
                })
                .join("\n\n")
        }

        protected runTest(testFile: string, testCase: TestCase) {
            test(`References: ${testCase.name}`, async () => {
                const caretIndexes = this.findCaretPositions(testCase.input)
                const positions = caretIndexes.map(index =>
                    this.calculatePosition(testCase.input, index),
                )
                const results = await this.getReferences(testCase.input)
                const actual = this.formatResult(positions, results)

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

    testSuite.runTestsFromDirectory("references")
})
