//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import {childByField, childByType, childrenByType, parseCode, visit} from "../cst/cst-helpers"

describe("comments", () => {
    function test(code: string, itemType: string, index: number, expected: string): () => void {
        return () => {
            const root = parseCode(code)
            if (!root) {
                fail("cannot parse code")
            }

            const module = childByType(root, "Module")
            if (!module) throw new Error("cannot parse module")

            const items = childByField(module, "items")
            if (!items) throw new Error("cannot parse items")

            const declarations = childrenByType(items, itemType)

            const decl = declarations[index]
            const docComments = childByField(decl, "doc")
            if (!docComments) throw new Error("cannot find doc comments")

            const docCommentText = visit(docComments).trim()
            expect(docCommentText).toBe(expected)
        }
    }

    it(
        "should correctly attach doc comments to function",
        test(
            `
                /// Some doc comment of function foo
                fun foo() {}
            `,
            "$Function",
            0,
            "/// Some doc comment of function foo",
        ),
    )

    it(
        "should correctly attach doc comments to struct",
        test(
            `
                /// Some doc comment of struct Foo
                struct Foo {}
            `,
            "StructDecl",
            0,
            "/// Some doc comment of struct Foo",
        ),
    )

    it(
        "should correctly attach doc comments to struct after function",
        test(
            `
                fun foo() {}

                /// Some doc comment of struct Foo
                struct Foo {}
            `,
            "StructDecl",
            0,
            "/// Some doc comment of struct Foo",
        ),
    )

    it(
        "should correctly attach doc comments to struct after function with inline comment",
        test(
            `
                fun foo() {} // inline comment of foo

                /// Some doc comment of struct Foo
                struct Foo {}
            `,
            "StructDecl",
            0,
            "/// Some doc comment of struct Foo",
        ),
    )
})
