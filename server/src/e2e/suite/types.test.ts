import * as vscode from "vscode"
import * as assert from "assert"
import {BaseTestSuite} from "./BaseTestSuite"

export const GetTypeAtPositionRequest = "tact/getTypeAtPosition"

export interface GetTypeAtPositionParams {
    textDocument: {
        uri: string
    }
    position: {
        line: number
        character: number
    }
}

export interface GetTypeAtPositionResponse {
    type: string | null
}

interface TypePosition {
    line: number
    character: number
    expectedType: string
}

suite("Type Inference Test Suite", () => {
    const testSuite = new (class extends BaseTestSuite {
        findTypePositions(input: string): TypePosition[] {
            const positions: TypePosition[] = []
            const lines = input.split("\n")

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i]
                if (line.includes("//!")) {
                    const caretPosition = line.indexOf("^")

                    const character = caretPosition
                    const expectedType = line.substring(caretPosition + 1).trim()

                    positions.push({
                        line: i - 1,
                        character: character,
                        expectedType,
                    })
                }
            }
            return positions
        }

        async getType(position: vscode.Position): Promise<string | undefined> {
            const params: GetTypeAtPositionParams = {
                textDocument: {
                    uri: this.document.uri.toString(),
                },
                position: {
                    line: position.line,
                    character: position.character,
                },
            }

            const response = await vscode.commands.executeCommand<GetTypeAtPositionResponse>(
                GetTypeAtPositionRequest,
                params,
            )

            return response?.type ?? undefined
        }

        protected async runTest(testFile: string, testCase: any) {
            test(`Types: ${testCase.name}`, async () => {
                const positions = this.findTypePositions(testCase.input)

                await this.replaceDocumentText(testCase.input)

                const errors: string[] = []

                for (const pos of positions) {
                    const params = new vscode.Position(pos.line, pos.character)
                    const type = await this.getType(params)
                    const actual = type || "unknown"

                    if (actual !== pos.expectedType) {
                        errors.push(
                            `type inference error at line ${pos.line + 1}: expected ${pos.expectedType}, got ${actual}`,
                        )
                    }
                }

                const actual = errors.length === 0 ? "ok" : errors.join("\n")

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

    testSuite.runTestsFromDirectory("types")
})
