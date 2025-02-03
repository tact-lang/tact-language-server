import * as vscode from "vscode"
import * as assert from "assert"
import {BaseTestSuite} from "./BaseTestSuite"
import {TestCase} from "./TestParser"

suite("Resolve Test Suite", () => {
    const testSuite = new (class extends BaseTestSuite {
        async getDefinitions(
            input: string,
        ): Promise<(vscode.LocationLink[] | vscode.Location[] | undefined)[]> {
            const caretIndexes = this.findCaretPositions(input)
            if (caretIndexes.length == 0) {
                throw new Error("No <caret> marker found in input")
            }

            const textWithoutCaret = input.replace(/<caret>/g, "")
            await this.replaceDocumentText(textWithoutCaret)

            return await Promise.all(
                caretIndexes.map(caretIndex => {
                    const position = this.calculatePosition(input, caretIndex)
                    return this.getDefinitionAt(position)
                }),
            )
        }

        async getDefinitionAt(
            position: vscode.Position,
        ): Promise<vscode.LocationLink[] | vscode.Location[] | undefined> {
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
            positions: vscode.Position[],
            definitions: (vscode.LocationLink[] | vscode.Location[] | undefined)[],
        ): string {
            return positions
                .map((pos, index) => {
                    const targets = definitions[index]
                    if (!targets || targets.length === 0) {
                        return `${this.formatLocation(pos)} unresolved`
                    }

                    const target = targets[0]
                    if (target instanceof vscode.Location) {
                        return `${this.formatLocation(pos)} -> ${this.formatLocation(
                            target.range.start,
                        )} resolved`
                    } else {
                        return `${this.formatLocation(pos)} -> ${this.formatLocation(
                            target.targetRange.start,
                        )} resolved`
                    }
                })
                .join("\n")
        }

        protected runTest(testFile: string, testCase: TestCase) {
            test(`Resolve: ${testCase.name}`, async () => {
                const caretIndexes = this.findCaretPositions(testCase.input)
                const positions = caretIndexes.map(index =>
                    this.calculatePosition(testCase.input, index),
                )
                const definitions = await this.getDefinitions(testCase.input)
                const actual = this.formatResult(positions, definitions)

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
