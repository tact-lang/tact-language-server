import * as fs from "node:fs"

interface TestCase {
    name: string
    properties: Record<string, string>
    input: string
    expected: string
    result?: string
}

enum ParserState {
    WaitingForTestStart,
    ReadingProperties,
    ReadingName,
    ReadingInput,
    ReadingExpected,
}

export class TestParser {
    static parseAll(content: string): TestCase[] {
        const tests: TestCase[] = []
        const lines = content.trim().replace(/\r\n/g, "\n").split("\n")

        let state = ParserState.WaitingForTestStart
        let currentTest: Partial<TestCase> = {}
        let currentContent = ""

        for (let line of lines) {
            line = line.trimEnd()

            switch (state) {
                case ParserState.WaitingForTestStart:
                    if (line === "=========") {
                        state = ParserState.ReadingProperties
                        currentTest = {properties: {}}
                    }
                    break

                case ParserState.ReadingProperties:
                    if (line.startsWith("@")) {
                        const [key, value] = line.substring(1).split(" ")
                        currentTest.properties![key] = value
                    } else {
                        currentTest.name = line
                        state = ParserState.ReadingName
                    }
                    break

                case ParserState.ReadingName:
                    if (line === "=========") {
                        state = ParserState.ReadingInput
                        currentContent = ""
                    }
                    break

                case ParserState.ReadingInput:
                    if (line === "------------") {
                        currentTest.input = currentContent.trim()
                        state = ParserState.ReadingExpected
                        currentContent = ""
                    } else {
                        currentContent += line + "\n"
                    }
                    break

                case ParserState.ReadingExpected:
                    if (line === "=========") {
                        currentTest.expected = currentContent.trim()
                        tests.push(currentTest as TestCase)
                        state = ParserState.ReadingProperties
                        currentTest = {properties: {}}
                        currentContent = ""
                    } else {
                        currentContent += line + "\n"
                    }
                    break
            }
        }

        // Добавляем последний тест
        if (currentTest.name && currentContent) {
            currentTest.expected = currentContent.trim()
            tests.push(currentTest as TestCase)
        }

        return tests
    }

    static updateExpected(filePath: string, testName: string, actual: string): void {
        const content = fs.readFileSync(filePath, "utf8")
        const lines = content.trim().replace(/\r\n/g, "\n").split("\n")
        const newLines: string[] = []

        let state = ParserState.WaitingForTestStart
        let isTargetTest = false
        let skipUntilNextTest = false

        for (let line of lines) {
            line = line.trimEnd()

            // Если встретили начало нового теста, прекращаем пропуск
            if (line === "=========") {
                skipUntilNextTest = false
            }

            // Пропускаем строки если это помеченный тест и мы в режиме пропуска
            if (skipUntilNextTest) {
                continue
            }

            switch (state) {
                case ParserState.WaitingForTestStart:
                    if (line === "=========") {
                        state = ParserState.ReadingProperties
                    }
                    newLines.push(line)
                    break

                case ParserState.ReadingProperties:
                    if (line.startsWith("@")) {
                        newLines.push(line)
                    } else {
                        isTargetTest = line === testName
                        state = ParserState.ReadingName
                        newLines.push(line)
                    }
                    break

                case ParserState.ReadingName:
                    if (line === "=========") {
                        state = ParserState.ReadingInput
                    }
                    newLines.push(line)
                    break

                case ParserState.ReadingInput:
                    if (line === "------------") {
                        state = ParserState.ReadingExpected
                        newLines.push(line)
                        if (isTargetTest) {
                            newLines.push(actual)
                            skipUntilNextTest = true
                            state = ParserState.WaitingForTestStart
                        }
                    } else {
                        newLines.push(line)
                    }
                    break

                case ParserState.ReadingExpected:
                    if (line === "=========") {
                        state = ParserState.ReadingProperties
                        newLines.push("")
                        newLines.push(line)
                    } else if (!isTargetTest) {
                        newLines.push(line)
                    }
                    break
            }
        }

        // Добавляем финальный перенос строки
        fs.writeFileSync(filePath, newLines.join("\n") + "\n")
    }

    static updateExpectedBatch(
        filePath: string,
        updates: {testName: string; actual: string}[],
    ): void {
        const tests = this.parseAll(fs.readFileSync(filePath, "utf8"))
        const newContent: string[] = []

        for (const test of tests) {
            if (newContent.length > 0) {
                newContent.push("")
            }

            newContent.push("=========")

            for (const [key, value] of Object.entries(test.properties)) {
                newContent.push(`@${key} ${value}`)
            }

            newContent.push(test.name)
            newContent.push("=========")
            newContent.push(test.input)
            newContent.push("------------")

            const update = updates.find(u => u.testName === test.name)
            newContent.push(update ? update.actual : test.expected)
        }

        fs.writeFileSync(filePath, newContent.join("\n") + "\n")
    }
}
