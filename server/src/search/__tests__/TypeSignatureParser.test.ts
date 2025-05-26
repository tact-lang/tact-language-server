import {TypeSignatureParser, TypeSignatureUtils} from "../TypeSignatureParser"

describe("TypeSignatureParser", () => {
    describe("parse", () => {
        it("should parse simple type signature", () => {
            const parser = new TypeSignatureParser("Int -> String")
            const result = parser.parse()

            expect(result).toEqual({
                parameters: [{kind: "concrete", name: "Int", optional: false}],
                returnType: {kind: "concrete", name: "String", optional: false},
            })
        })

        it("should parse wildcard parameter", () => {
            const parser = new TypeSignatureParser("_ -> Address")
            const result = parser.parse()

            expect(result).toEqual({
                parameters: [{kind: "wildcard", optional: false}],
                returnType: {kind: "concrete", name: "Address", optional: false},
            })
        })

        it("should parse multiple parameters", () => {
            const parser = new TypeSignatureParser("Int, String -> Bool")
            const result = parser.parse()

            expect(result).toEqual({
                parameters: [
                    {kind: "concrete", name: "Int", optional: false},
                    {kind: "concrete", name: "String", optional: false},
                ],
                returnType: {kind: "concrete", name: "Bool", optional: false},
            })
        })

        it("should parse no parameters", () => {
            const parser = new TypeSignatureParser("-> Int")
            const result = parser.parse()

            expect(result).toEqual({
                parameters: [],
                returnType: {kind: "concrete", name: "Int", optional: false},
            })
        })

        it("should parse optional types", () => {
            const parser = new TypeSignatureParser("Int? -> String")
            const result = parser.parse()

            expect(result).toEqual({
                parameters: [{kind: "concrete", name: "Int", optional: true}],
                returnType: {kind: "concrete", name: "String", optional: false},
            })
        })

        it("should handle whitespace", () => {
            const parser = new TypeSignatureParser("  Int  ,  String  ->  Bool  ")
            const result = parser.parse()

            expect(result).toEqual({
                parameters: [
                    {kind: "concrete", name: "Int", optional: false},
                    {kind: "concrete", name: "String", optional: false},
                ],
                returnType: {kind: "concrete", name: "Bool", optional: false},
            })
        })

        it("should throw error for invalid signature", () => {
            const parser = new TypeSignatureParser("invalid")

            expect(() => parser.parse()).toThrow("Invalid type signature format")
        })

        it("should parse void return type", () => {
            const parser = new TypeSignatureParser("Int -> void")
            const result = parser.parse()

            expect(result).toEqual({
                parameters: [{kind: "concrete", name: "Int", optional: false}],
                returnType: {kind: "concrete", name: "void", optional: false},
            })
        })

        it("should parse void with no parameters", () => {
            const parser = new TypeSignatureParser("-> void")
            const result = parser.parse()

            expect(result).toEqual({
                parameters: [],
                returnType: {kind: "concrete", name: "void", optional: false},
            })
        })
    })
})

describe("TypeSignatureUtils", () => {
    describe("matchesSignature", () => {
        it("should match exact signature", () => {
            const result = TypeSignatureUtils.matchesSignature("(a: Int, b: String): Bool", {
                parameters: [
                    {kind: "concrete", name: "Int", optional: false},
                    {kind: "concrete", name: "String", optional: false},
                ],
                returnType: {kind: "concrete", name: "Bool", optional: false},
            })

            expect(result).toBe(true)
        })

        it("should match wildcard parameters", () => {
            const result = TypeSignatureUtils.matchesSignature("(a: Int, b: String): Bool", {
                parameters: [{kind: "wildcard", optional: false}],
                returnType: {kind: "concrete", name: "Bool", optional: false},
            })

            expect(result).toBe(true)
        })

        it("should not match different return type", () => {
            const result = TypeSignatureUtils.matchesSignature("(a: Int): Bool", {
                parameters: [{kind: "concrete", name: "Int", optional: false}],
                returnType: {kind: "concrete", name: "String", optional: false},
            })

            expect(result).toBe(false)
        })

        it("should not match different parameter count", () => {
            const result = TypeSignatureUtils.matchesSignature("(a: Int, b: String): Bool", {
                parameters: [{kind: "concrete", name: "Int", optional: false}],
                returnType: {kind: "concrete", name: "Bool", optional: false},
            })

            expect(result).toBe(false)
        })

        it("should match no parameters", () => {
            const result = TypeSignatureUtils.matchesSignature("(): Int", {
                parameters: [],
                returnType: {kind: "concrete", name: "Int", optional: false},
            })

            expect(result).toBe(true)
        })

        it("should match optional types correctly", () => {
            const optionalResult = TypeSignatureUtils.matchesSignature("(a: Int?): String", {
                parameters: [{kind: "concrete", name: "Int", optional: true}],
                returnType: {kind: "concrete", name: "String", optional: false},
            })
            expect(optionalResult).toBe(true)

            const nonOptionalResult = TypeSignatureUtils.matchesSignature("(a: Int): String", {
                parameters: [{kind: "concrete", name: "Int", optional: true}],
                returnType: {kind: "concrete", name: "String", optional: false},
            })
            expect(nonOptionalResult).toBe(false)

            const exactResult = TypeSignatureUtils.matchesSignature("(a: Int): String", {
                parameters: [{kind: "concrete", name: "Int", optional: false}],
                returnType: {kind: "concrete", name: "String", optional: false},
            })
            expect(exactResult).toBe(true)

            const mismatchResult = TypeSignatureUtils.matchesSignature("(a: Int?): String", {
                parameters: [{kind: "concrete", name: "Int", optional: false}],
                returnType: {kind: "concrete", name: "String", optional: false},
            })
            expect(mismatchResult).toBe(false)
        })

        it("should match void functions correctly", () => {
            const voidResult = TypeSignatureUtils.matchesSignature("(a: Int)", {
                parameters: [{kind: "concrete", name: "Int", optional: false}],
                returnType: {kind: "concrete", name: "void", optional: false},
            })
            expect(voidResult).toBe(true)

            const voidNoParamsResult = TypeSignatureUtils.matchesSignature("()", {
                parameters: [],
                returnType: {kind: "concrete", name: "void", optional: false},
            })
            expect(voidNoParamsResult).toBe(true)

            const nonVoidResult = TypeSignatureUtils.matchesSignature("(a: Int): String", {
                parameters: [{kind: "concrete", name: "Int", optional: false}],
                returnType: {kind: "concrete", name: "void", optional: false},
            })
            expect(nonVoidResult).toBe(false)

            const voidMismatchResult = TypeSignatureUtils.matchesSignature("(a: Int)", {
                parameters: [{kind: "concrete", name: "Int", optional: false}],
                returnType: {kind: "concrete", name: "String", optional: false},
            })
            expect(voidMismatchResult).toBe(false)
        })
    })
})
