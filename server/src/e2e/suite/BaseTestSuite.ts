import * as vscode from "vscode"
import * as path from "path"
import * as fs from "fs"
import * as glob from "glob"
import {activate} from "../utils"
import {TestCase, TestParser} from "./TestParser"

export interface TestUpdate {
    filePath: string
    testName: string
    actual: string
}

export abstract class BaseTestSuite {
    protected static readonly UPDATE_SNAPSHOTS = process.env["UPDATE_SNAPSHOTS"] === "true"
    protected document!: vscode.TextDocument
    protected editor!: vscode.TextEditor
    protected testFilePath!: string
    protected updates: TestUpdate[] = []

    async suiteSetup() {
        await activate()
    }

    async setup() {
        this.testFilePath = path.join(__dirname, "../../../test-workspace/test.tact")
        const testDir = path.dirname(this.testFilePath)
        await fs.promises.mkdir(testDir, {recursive: true})
        await fs.promises.writeFile(this.testFilePath, "")

        this.document = await vscode.workspace.openTextDocument(this.testFilePath)
        await vscode.languages.setTextDocumentLanguage(this.document, "tact")
        this.editor = await vscode.window.showTextDocument(this.document)
    }

    async teardown() {
        await vscode.commands.executeCommand("workbench.action.closeActiveEditor")
        try {
            await fs.promises.unlink(this.testFilePath)
        } catch (e) {
            console.warn("Failed to delete test file:", e)
        }
    }

    protected calculatePosition(text: string, caretIndex: number): vscode.Position {
        const textBeforeCaret = text.substring(0, caretIndex)
        const lines = textBeforeCaret.split("\n")
        const line = lines.length - 1
        const character = lines[line].length

        return new vscode.Position(line, character)
    }

    protected async replaceDocumentText(text: string) {
        await this.editor.edit(edit => {
            const fullRange = new vscode.Range(
                this.document.positionAt(0),
                this.document.positionAt(this.document.getText().length),
            )
            edit.replace(fullRange, text)
        })
    }

    protected findCaretPositions(text: string): number[] {
        const positions: number[] = []
        const regex = /<caret>/g
        let match

        while ((match = regex.exec(text)) !== null) {
            positions.push(match.index)
        }

        return positions
    }

    suiteTeardown(): true {
        const fileUpdates = new Map<string, TestUpdate[]>()

        for (const update of this.updates) {
            const updates = fileUpdates.get(update.filePath) || []
            updates.push(update)
            fileUpdates.set(update.filePath, updates)
        }

        for (const [filePath, updates] of fileUpdates.entries()) {
            TestParser.updateExpectedBatch(filePath, updates)
        }
        return true
    }

    runTestsFromDirectory(directory: string) {
        const testCasesPath = path.join(
            __dirname,
            "..",
            "..",
            "suite",
            "testcases",
            directory,
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
                this.runTest(testFile, testCase)
            }
        }
    }

    protected abstract runTest(testFile: string, testCase: TestCase): void
}
