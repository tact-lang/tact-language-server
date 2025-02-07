import * as path from "path"
import * as Mocha from "mocha"
import {glob} from "glob"

export function run(): Promise<void> {
    const mocha = new Mocha({
        ui: "tdd",
        color: true,
        timeout: 20000,
    })

    const testsRoot = path.resolve(__dirname, ".")

    return new Promise((resolve, reject) => {
        glob("completion.test.js", {
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
                } catch (err) {
                    reject(err instanceof Error ? err : new Error(String(err)))
                }
            })
            .catch((err: unknown) => {
                reject(err instanceof Error ? err : new Error(String(err)))
            })
    })
}
