import * as vscode from "vscode"
import * as assert from "node:assert"
import {BaseTestSuite} from "./BaseTestSuite"
import type {TestCase} from "./TestParser"

interface SearchByTypeParams {
    readonly query: string
    readonly scope?: "workspace" | "everywhere"
}

interface TypeSearchResult {
    readonly name: string
    readonly signature: string
    readonly kind: "function" | "method" | "getter" | "constructor"
    readonly containerName?: string
}

interface SearchByTypeResponse {
    readonly results: TypeSearchResult[]
    readonly error: string | null
}

suite("Type-Based Search Test Suite", () => {
    const testSuite = new (class extends BaseTestSuite {
        private async searchByType(query: string): Promise<SearchByTypeResponse> {
            const params: SearchByTypeParams = {
                query,
                scope: "workspace",
            }

            return vscode.commands.executeCommand<SearchByTypeResponse>("tact/searchByType", params)
        }

        private parseSearchQueries(input: string): string[] {
            const queries: string[] = []
            const lines = input.split("\n")

            for (const line of lines) {
                const searchMatch = /\/\/!\s*SEARCH:\s*(.+)/.exec(line)
                if (searchMatch) {
                    queries.push(searchMatch[1].trim())
                }
            }

            return queries
        }

        protected runTest(testFile: string, testCase: TestCase): void {
            test(`Type-Based Search: ${testCase.name}`, async () => {
                await this.replaceDocumentText(testCase.input)

                const testQueries = this.parseSearchQueries(testCase.input)

                if (testQueries.length === 0) {
                    throw new Error(`No search queries found in test case: ${testCase.name}`)
                }

                const results: string[] = []

                for (const query of testQueries) {
                    try {
                        const response = await this.searchByType(query)

                        if (response.error) {
                            results.push(`Query "${query}": Error - ${response.error}`)
                        } else {
                            results.push(`Query "${query}": ${response.results.length} results`)

                            if (response.results.length > 0) {
                                const names = response.results.map(r => r.name).sort()
                                results.push(`  Functions: ${names.join(", ")}`)
                            }
                        }
                    } catch (error) {
                        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                        results.push(`Query "${query}": Error - ${error}`)
                    }
                }

                const actual = results.join("\n")

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
        this.timeout(10_000)
        await testSuite.suiteSetup()
    })

    setup(async () => testSuite.setup())
    teardown(async () => testSuite.teardown())
    suiteTeardown(() => testSuite.suiteTeardown())

    testSuite.runTestsFromDirectory("search")
})
