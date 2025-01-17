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

suite("Completion Test Suite", () => {
    let document: vscode.TextDocument
    let editor: vscode.TextEditor
    let testFilePath: string
    const updates: TestUpdate[] = []

    suiteSetup(async function () {
        this.timeout(10000)
        await activate()

        const languages = await vscode.languages.getLanguages()
        if (!languages.includes("tact")) {
            throw new Error("Tact language is not registered")
        }
    })

    setup(async () => {
        testFilePath = path.join(__dirname, "../../../test-workspace/test.tact")
        const testDir = path.dirname(testFilePath)
        await fs.promises.mkdir(testDir, {recursive: true})
        await fs.promises.writeFile(testFilePath, "")

        document = await vscode.workspace.openTextDocument(testFilePath)
        await vscode.languages.setTextDocumentLanguage(document, "tact")
        editor = await vscode.window.showTextDocument(document)

        if (document.languageId !== "tact") {
            throw new Error(`Document has wrong language: ${document.languageId}`)
        }
    })

    teardown(async () => {
        await vscode.commands.executeCommand("workbench.action.closeActiveEditor")
        try {
            await fs.promises.unlink(testFilePath)
        } catch (e) {
            console.warn("Failed to delete test file:", e)
        }
    })

    async function getCompletions(input: string, triggerCharacter?: string): Promise<vscode.CompletionList> {
        const textWithoutCaret = input.replace("<caret>", "")

        await editor.edit(edit => {
            const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length))
            edit.replace(fullRange, textWithoutCaret)
        })

        const caretIndex = input.indexOf("<caret>")
        if (caretIndex === -1) {
            throw new Error("No <caret> marker found in input")
        }

        const position = document.positionAt(caretIndex)
        editor.selection = new vscode.Selection(position, position)
        editor.revealRange(new vscode.Range(position, position))

        return vscode.commands.executeCommand<vscode.CompletionList>(
            "vscode.executeCompletionItemProvider",
            document.uri,
            position,
            triggerCharacter,
        )
    }

    suiteTeardown(async () => {
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

    const testCasesPath = path.join(__dirname, "..", "..", "suite", "testcases", "completion", "*.test")
    const testFiles = glob.sync(testCasesPath)

    if (testFiles.length === 0) {
        throw new Error(`No test files found in ${path.dirname(testCasesPath)}`)
    }

    for (const testFile of testFiles) {
        const content = fs.readFileSync(testFile, "utf8")
        const testCases = TestParser.parseAll(content)

        for (const testCase of testCases) {
            test(`Completion: ${testCase.name}`, async function () {
                const completions = await getCompletions(testCase.input, testCase.properties["trigger"])

                if (testCase.properties["json"] === "true") {
                    const expected = JSON.parse(testCase.expected)
                    const actual = {
                        items: completions.items.map(item => ({
                            label: item.label,
                            kind: vscode.CompletionItemKind[item.kind!],
                            detail: item.detail,
                        })),
                    }

                    if (UPDATE_SNAPSHOTS) {
                        updates.push({
                            filePath: testFile,
                            testName: testCase.name,
                            actual: JSON.stringify(actual, null, 4),
                        })
                    } else {
                        assert.deepStrictEqual(actual, expected)
                    }
                } else {
                    const items = completions.items
                        .map(item => item.label)
                        .map(item => (typeof item === "object" ? item.label : item))
                    const expected = testCase.expected.split("\n").filter(Boolean)

                    if (UPDATE_SNAPSHOTS) {
                        updates.push({
                            filePath: testFile,
                            testName: testCase.name,
                            actual: items.join("\n"),
                        })
                    } else {
                        assert.deepStrictEqual(items.sort(), expected.sort())
                    }
                }
            })
        }
    }
})
