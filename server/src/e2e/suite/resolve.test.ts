import * as vscode from "vscode"
import * as assert from "assert"
import * as path from "path"
import * as fs from "fs"
import * as glob from "glob"
import {activate} from "../utils"
import {TestParser} from "./TestParser"

const UPDATE_SNAPSHOTS = process.env["UPDATE_SNAPSHOTS"] === "true"

interface TestUpdate {
    filePath: string
    testName: string
    actual: string
}

suite("Resolve Test Suite", () => {
    let document: vscode.TextDocument
    let editor: vscode.TextEditor
    let testFilePath: string
    const updates: TestUpdate[] = []

    suiteSetup(async function () {
        this.timeout(10000)
        await activate()
    })

    setup(async () => {
        testFilePath = path.join(__dirname, "../../../test-workspace/test.tact")
        const testDir = path.dirname(testFilePath)
        await fs.promises.mkdir(testDir, {recursive: true})
        await fs.promises.writeFile(testFilePath, "")

        document = await vscode.workspace.openTextDocument(testFilePath)
        await vscode.languages.setTextDocumentLanguage(document, "tact")
        editor = await vscode.window.showTextDocument(document)
    })

    teardown(async () => {
        await vscode.commands.executeCommand("workbench.action.closeActiveEditor")
        try {
            await fs.promises.unlink(testFilePath)
        } catch (e) {
            console.warn("Failed to delete test file:", e)
        }
    })

    function calculatePosition(text: string, caretIndex: number): vscode.Position {
        const textBeforeCaret = text.substring(0, caretIndex)
        const lines = textBeforeCaret.split("\n")
        const line = lines.length - 1
        const character = lines[line].length

        return new vscode.Position(line, character)
    }

    async function getDefinition(
        input: string,
    ): Promise<vscode.LocationLink[] | vscode.Location[] | undefined> {
        const caretIndex = input.indexOf("<caret>")
        if (caretIndex === -1) {
            throw new Error("No <caret> marker found in input")
        }

        const textWithoutCaret = input.replace("<caret>", "")
        await editor.edit(edit => {
            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(document.getText().length),
            )
            edit.replace(fullRange, textWithoutCaret)
        })

        const position = calculatePosition(input, caretIndex)

        return vscode.commands.executeCommand<vscode.LocationLink[]>(
            "vscode.executeDefinitionProvider",
            document.uri,
            position,
        )
    }

    function formatLocation(position: vscode.Position): string {
        return `${position.line}:${position.character}`
    }

    function formatResult(
        sourcePosition: vscode.Position,
        definition?: vscode.LocationLink[] | vscode.Location[],
    ): string {
        if (!definition || definition.length === 0) {
            return `${formatLocation(sourcePosition)} unresolved`
        }

        const target = definition[0]
        if (target instanceof vscode.Location) {
            return `${formatLocation(sourcePosition)} -> ${formatLocation(target.range.start)} resolved`
        } else {
            return `${formatLocation(sourcePosition)} -> ${formatLocation(target.targetRange.start)} resolved`
        }
    }

    suiteTeardown(() => {
        const fileUpdates = new Map<string, TestUpdate[]>()

        for (const update of updates) {
            const updates = fileUpdates.get(update.filePath) || []
            updates.push(update)
            fileUpdates.set(update.filePath, updates)
        }

        for (const [filePath, updates] of fileUpdates.entries()) {
            TestParser.updateExpectedBatch(filePath, updates)
        }
    })

    const testCasesPath = path.join(
        __dirname,
        "..",
        "..",
        "suite",
        "testcases",
        "resolve",
        "*.test",
    )
    const testFiles = glob.sync(testCasesPath)

    if (testFiles.length === 0) {
        throw new Error(`No test files found in ${path.dirname(testCasesPath)}`)
    }

    for (const testFile of testFiles) {
        const content = fs.readFileSync(testFile, "utf8")
        const testCases = TestParser.parseAll(content)

        for (const testCase of testCases) {
            test(`Resolve: ${testCase.name}`, async function () {
                const caretIndex = testCase.input.indexOf("<caret>")
                const sourcePosition = calculatePosition(testCase.input, caretIndex)
                const definition = await getDefinition(testCase.input)
                const actual = formatResult(sourcePosition, definition)

                if (UPDATE_SNAPSHOTS) {
                    updates.push({
                        filePath: testFile,
                        testName: testCase.name,
                        actual,
                    })
                } else {
                    assert.strictEqual(actual, testCase.expected)
                }
            })
        }
    }
})
