import * as cp from "node:child_process"
import * as path from "node:path"

interface CompilerError {
    line: number
    character: number
    message: string
    file: string
    length?: number
}

export class TactCompiler {
    private static parseCompilerOutput(output: string): CompilerError[] {
        const errors: CompilerError[] = []
        const lines = output.split("\n")

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            const match = /^Error: ([^:]+):(\d+):(\d+): (.+)$/.exec(line)
            if (!match) continue

            console.info(`[TactCompiler] Found error line: ${line}`)
            const [, file, lineNum, char, rawMessage] = match
            let fullMessage = `${file}:${lineNum}:${char}: ${rawMessage}\n`
            let contextFound = false

            for (let j = i + 1; j < lines.length; j++) {
                const nextLine = lines[j]
                if (nextLine.startsWith("Error:")) break
                if (nextLine.includes("Line") || nextLine.includes("|") || nextLine.includes("^")) {
                    contextFound = true
                    fullMessage += nextLine + "\n"
                    i = j
                }
            }

            const error: CompilerError = {
                file,
                line: Number.parseInt(lineNum, 10) - 1,
                character: Number.parseInt(char, 10) - 1,
                message: contextFound ? fullMessage.trim() : rawMessage,
            }

            if (contextFound) {
                const caretLine = fullMessage.split("\n").find(l => l.includes("^"))
                if (caretLine) error.length = caretLine.trim().length
            }

            errors.push(error)
            console.info(`[TactCompiler] Parsed error: ${JSON.stringify(error)}`)
        }

        return errors
    }

    static async compile(_filePath: string): Promise<CompilerError[]> {
        return new Promise((resolve, reject) => {
            const tactPath = path.join(__dirname, "../node_modules/.bin/tact")

            const process = cp.exec(
                `${tactPath} --check --config ./tact.config.json`,
                (_1, _2, stderr) => {
                    const errors = this.parseCompilerOutput(stderr)
                    resolve(errors)
                },
            )

            process.on("error", error => {
                console.error(`Failed to start compiler: ${error}`)
                reject(error)
            })
        })
    }
}
