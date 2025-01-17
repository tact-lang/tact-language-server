import * as vscode from "vscode"
import * as assert from "assert"
import {BaseTestSuite} from "./BaseTestSuite"

suite("Resolve Test Suite", () => {
    const testSuite = new (class extends BaseTestSuite {
        async getDefinition(
            input: string,
        ): Promise<vscode.LocationLink[] | vscode.Location[] | undefined> {
            const caretIndex = input.indexOf("<caret>")
            if (caretIndex === -1) {
                throw new Error("No <caret> marker found in input")
            }

            const textWithoutCaret = input.replace("<caret>", "")
            await this.replaceDocumentText(textWithoutCaret)
            const position = this.calculatePosition(input, caretIndex)

            return vscode.commands.executeCommand<vscode.LocationLink[]>(
                "vscode.executeDefinitionProvider",
                this.document.uri,
                position,
            )
        }

        formatLocation(position: vscode.Position): string {
            return `${position.line}:${position.character}`
        }

        formatResult(
            sourcePosition: vscode.Position,
            definition?: vscode.LocationLink[] | vscode.Location[],
        ): string {
            if (!definition || definition.length === 0) {
                return `${this.formatLocation(sourcePosition)} unresolved`
            }

            const target = definition[0]
            if (target instanceof vscode.Location) {
                return `${this.formatLocation(sourcePosition)} -> ${this.formatLocation(
                    target.range.start,
                )} resolved`
            } else {
                return `${this.formatLocation(sourcePosition)} -> ${this.formatLocation(
                    target.targetRange.start,
                )} resolved`
            }
        }

        protected runTest(testFile: string, testCase: any) {
            test(`Resolve: ${testCase.name}`, async () => {
                const caretIndex = testCase.input.indexOf("<caret>")
                const sourcePosition = this.calculatePosition(testCase.input, caretIndex)
                const definition = await this.getDefinition(testCase.input)
                const actual = this.formatResult(sourcePosition, definition)

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

    testSuite.runTestsFromDirectory("resolve")
})
