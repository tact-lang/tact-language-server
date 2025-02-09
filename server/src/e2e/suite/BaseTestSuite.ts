import * as vscode from "vscode"
import * as path from "node:path"
import * as fs from "node:fs"
import * as glob from "glob"
import {TestCase, TestParser} from "./TestParser"

export interface TestUpdate {
    filePath: string
    testName: string
    actual: string
}

export abstract class BaseTestSuite {
    protected static readonly UPDATE_SNAPSHOTS: boolean = true
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
        } catch (error) {
            console.warn("Failed to delete test file:", error)
        }
    }

    protected calculatePosition(text: string, caretIndex: number): vscode.Position {
        const textBeforeCaret = text.slice(0, caretIndex)
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
        let match: RegExpExecArray | null = null

        while ((match = regex.exec(text)) !== null) {
            positions.push(match.index)
        }

        return positions
    }

    suiteTeardown() {
        const fileUpdates: Map<string, TestUpdate[]> = new Map()

        for (const update of this.updates) {
            const updates = fileUpdates.get(update.filePath) ?? []
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
        const testFiles = glob.sync(testCasesPath, {windowsPathsNoEscape: true})

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

async function activate(): Promise<void> {
    console.log("Activating extension...")

    const ext = vscode.extensions.getExtension("tonstudio.vscode-tact")
    if (!ext) {
        throw new Error(
            "Extension not found. Make sure the extension is installed and the ID is correct (tonstudio.vscode-tact)",
        )
    }

    console.log("Extension found, activating...")
    await ext.activate()

    console.log("Waiting for language server initialization...")
    await new Promise(resolve => setTimeout(resolve, 1000))

    const languages = await vscode.languages.getLanguages()
    if (!languages.includes("tact")) {
        throw new Error("Tact language not registered. Check package.json configuration.")
    }

    if (!ext.isActive) {
        throw new Error("Extension failed to activate")
    }

    console.log("Extension activated successfully")
}
