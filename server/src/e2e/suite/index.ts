import * as path from "node:path"
import * as Mocha from "mocha"
import {glob} from "glob"

export async function run(): Promise<void> {
    const mocha = new Mocha({
        ui: "tdd",
        color: true,
        timeout: 20_000,
    })

    process.env["TACT_LS_SKIP_STDLIB_IN_TESTS"] = "true"

    const testsRoot = path.resolve(__dirname, ".")

    return new Promise((resolve, reject) => {
        glob("*.test.js", {
            cwd: testsRoot,
        })
            .then(files => {
                files.forEach((f: string) => mocha.addFile(path.resolve(testsRoot, f)))

                try {
                    mocha.run(failures => {
                        if (failures > 0) {
                            reject(new Error(`${failures} tests failed.`))
                        } else {
                            resolve()
                        }
                    })
                } catch (error) {
                    reject(error instanceof Error ? error : new Error(String(error)))
                }
            })
            .catch((error: unknown) => {
                reject(error instanceof Error ? error : new Error(String(error)))
            })
    })
}
