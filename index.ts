import {ast} from "@ton-community/tlb-parser"
import {generateCodeByAST} from "@ton-community/tlb-codegen/src/main"
import {TLBCode} from "@ton-community/tlb-codegen/src/ast"
import {TypescriptGenerator} from "@ton-community/tlb-codegen/src/generators/typescript/generator"
import * as fs from "node:fs"
import {Builder, Slice} from "@ton/core"
import {exec, execSync} from "node:child_process"

async function importGeneratedCode(tsCode: string) {
    const ts = await import("typescript")
    const transpiled = ts.transpile(tsCode, {module: ts.ModuleKind.ESNext})

    const filePath = "./generated.mjs"
    fs.writeFileSync(filePath, transpiled)

    const module = await import(filePath)

    fs.unlink(filePath, () => {
    }) // удаляем временный файл после загрузки
    return module
}

const input = `

t$_ x:# y:(uint x) = A;

`
const tree = ast(input)

const getGenerator = (tlbCode: TLBCode) => new TypescriptGenerator(tlbCode)

const res = generateCodeByAST(tree, input, getGenerator)

console.log(res)

importGeneratedCode(res).then(mod => {
    console.log(mod.loadA(serializeA(5, 20)))
})

function serializeA(x: number, y: number): Slice {
    const builder = new Builder()
    builder.storeUint(x, 32)
    builder.storeUint(y, x)
    return builder.endCell().beginParse()
}

// function parseTLB(content: string): string[] {
//     const tlbRegex = /TLB:\s*`([^`]+)`/g
//     const matches: string[] = []
//     let match
//
//     while ((match = tlbRegex.exec(content)) !== null) {
//         matches.push(match[1])
//     }
//
//     return matches.filter(it => it !== "null")
// }
//
// function extractTLBFromFile(filePath: string): string[] {
//     try {
//         const content = fs.readFileSync(filePath, "utf8")
//         return parseTLB(content)
//     } catch (error) {
//         console.error("Ошибка при чтении файла:", error)
//         return []
//     }
// }
//
// const filePath = "/Users/petrmakhnev/contest_bridge/contracts/lite_client_LiteClientContest.md"
// const tlbDefinitions = extractTLBFromFile(filePath)
//
// // Сохранение TLB в файлы и выполнение команды
// function saveAndExecuteTLB(tlbDefinitions: string[]): void {
//     const errors: string[] = []
//
//     tlbDefinitions.forEach(tlb => {
//         const fileName = `1.tlb`
//         fs.writeFileSync(fileName, tlb + ";", "utf8")
//         try {
//             const result = execSync(
//                 `/Users/petrmakhnev/ton-tolk/cmake-build-debug/crypto/tlbc -q ${fileName}`,
//             )
//
//             // errors.push(result.toString())
//         } catch (error) {
//             errors.push(error.toString())
//         }
//     })
//
//     console.log(`errors: ${errors.length}`)
//     errors.forEach((error) => {
//         console.log(error)
//     })
// }
//
// console.log("Найденные TLB:", tlbDefinitions)
// saveAndExecuteTLB(tlbDefinitions)
