import * as cp from "child_process"
import * as path from "path"
import {Logger} from "@server/utils/logger"

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

            // Error: sources/jetton_wallet.tact:21:9: Function "forward" expects 4 arguments, got 0
            const match = line.match(/Error: (.*):(\d+):(\d+): (.*)/)
            if (match) {
                const error: CompilerError = {
                    file: match[1],
                    line: parseInt(match[2]) - 1,
                    character: parseInt(match[3]) - 1,
                    message: match[4],
                }

                while (i < lines.length - 1) {
                    i++
                    const nextLine = lines[i]
                    if (nextLine.includes("^")) {
                        error.length = nextLine.trim().length
                        break
                    }
                }

                errors.push(error)
            }
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
                Logger.getInstance().error(`Failed to start compiler: ${error}`)
                reject(error)
            })
        })
    }
}
