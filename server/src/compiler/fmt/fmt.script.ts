//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import * as fs from "node:fs"
import * as path from "node:path"
import {formatCode} from "@server/compiler/fmt/fmt"

const args = process.argv.slice(2)
const firstArg = args.shift()
if (!firstArg) {
    throw new Error("expected argument")
}

if (!fs.statSync(firstArg).isFile()) {
    const files = fs.globSync("**/*.tact", {
        cwd: "/Users/petrmakhnev/tact",
        withFileTypes: false,
        exclude: (file): boolean => {
            return (
                file.includes("renamer-expected") ||
                file.includes("test-failed") ||
                file === "config.tact"
            )
        },
    })

    files.forEach(file => {
        const basePath = "/Users/petrmakhnev/tact"
        const fullPath = path.join(basePath, file)

        if (fullPath.includes("grammar/test")) {
            return
        }

        const content = fs.readFileSync(fullPath, "utf8")
        const result = formatCode(content)
        if (result.$ === "FormatCodeError") {
            console.log(result.message)
            return
        }

        if (result.code === content) {
            // console.log("already formatted")
            return
        }

        console.log(`reformat ${file}`)
        fs.writeFileSync(fullPath, result.code)
    })

    process.exit(0)
}

const code = fs.readFileSync(`${process.cwd()}/${firstArg}`, "utf8")

const result = formatCode(code)
if (result.$ === "FormatCodeError") {
    throw new Error(result.message)
}

const name = path.basename(firstArg)
fs.writeFileSync(`${name}.fmt.tact`, result.code)
