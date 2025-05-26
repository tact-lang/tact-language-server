/**
 * Parser for type signatures like "Int -> String", "_ -> Address", etc.
 */
export class TypeSignatureParser {
    private readonly query: string
    private position: number

    public constructor(query: string) {
        this.query = query.trim()
        this.position = 0
    }

    public parse(): TypeSignature | null {
        try {
            return this.parseSignature()
        } catch (error) {
            console.debug("Failed to parse type signature:", error)
            return null
        }
    }

    private parseSignature(): TypeSignature {
        const parameters = this.parseParameters()

        this.skipWhitespace()
        if (!this.consume("->")) {
            throw new Error("Expected '->' in type signature")
        }
        this.skipWhitespace()

        const returnType = this.parseType()

        return {
            parameters,
            returnType,
        }
    }

    private parseParameters(): TypePattern[] {
        const parameters: TypePattern[] = []

        this.skipWhitespace()

        if (this.peek() === "-") {
            return parameters
        }

        parameters.push(this.parseType())

        this.skipWhitespace()
        while (this.peek() === ",") {
            this.consume(",")
            this.skipWhitespace()
            parameters.push(this.parseType())
            this.skipWhitespace()
        }

        return parameters
    }

    private parseType(): TypePattern {
        this.skipWhitespace()

        if (this.consume("_")) {
            return {kind: "wildcard", optional: false}
        }

        const typeName = this.parseTypeName()
        if (!typeName) {
            throw new Error("Expected type name")
        }

        const isOptional = this.peek() === "?"
        if (isOptional) {
            this.consume("?")
        }

        if (this.peek() === "<") {
            this.consume("<")
            const generics = this.parseGenerics()
            this.consume(">")

            return {
                kind: "concrete",
                name: typeName,
                generics,
                optional: isOptional || false,
            }
        }

        return {
            kind: "concrete",
            name: typeName,
            optional: isOptional || false,
        }
    }

    private parseGenerics(): TypePattern[] {
        const generics: TypePattern[] = []

        this.skipWhitespace()
        generics.push(this.parseType())

        this.skipWhitespace()
        while (this.peek() === ",") {
            this.consume(",")
            this.skipWhitespace()
            generics.push(this.parseType())
            this.skipWhitespace()
        }

        return generics
    }

    private parseTypeName(): string | null {
        this.skipWhitespace()

        const start = this.position
        while (this.position < this.query.length) {
            const char = this.query[this.position]
            if (/\w/.test(char)) {
                this.position++
            } else {
                break
            }
        }

        if (this.position === start) {
            return null
        }

        return this.query.slice(start, this.position)
    }

    private skipWhitespace(): boolean {
        const start = this.position
        while (this.position < this.query.length && /\s/.test(this.query[this.position])) {
            this.position++
        }
        return this.position > start
    }

    private peek(): string {
        return this.query[this.position] || ""
    }

    private consume(expected: string): boolean {
        if (this.query.slice(this.position, this.position + expected.length) === expected) {
            this.position += expected.length
            return true
        }
        return false
    }
}

export interface TypeSignature {
    readonly parameters: TypePattern[]
    readonly returnType: TypePattern
}

export interface TypePattern {
    readonly kind: "concrete" | "wildcard"
    readonly name?: string
    readonly generics?: readonly TypePattern[]
    readonly optional: boolean
}

/**
 * Utility functions for working with type signatures
 */
export class TypeSignatureUtils {
    /**
     * Check if a function signature matches the given type pattern
     */
    public static matchesSignature(functionSignature: string, pattern: TypeSignature): boolean {
        const parsed = this.parseFunctionSignature(functionSignature)
        if (!parsed) return false

        if (
            !this.hasWildcardParameters(pattern) &&
            parsed.parameters.length !== pattern.parameters.length
        ) {
            return false
        }

        if (!this.matchesType(parsed.returnType, pattern.returnType)) {
            return false
        }

        for (let i = 0; i < pattern.parameters.length; i++) {
            const patternParam = pattern.parameters[i]
            const functionParam = parsed.parameters[i]

            if (patternParam.kind === "wildcard") {
                continue // wildcard matches anything
            }

            if (!functionParam || !this.matchesType(functionParam, patternParam)) {
                return false
            }
        }

        return true
    }

    private static hasWildcardParameters(pattern: TypeSignature): boolean {
        return pattern.parameters.some(p => p.kind === "wildcard")
    }

    private static matchesType(actualType: string, pattern: TypePattern): boolean {
        if (pattern.kind === "wildcard") {
            return true
        }

        if (!pattern.name) {
            return false
        }

        // TODO: add support for generics and optional types
        return (
            actualType === pattern.name ||
            actualType === `${pattern.name}?` ||
            (pattern.optional && actualType === pattern.name)
        )
    }

    private static parseFunctionSignature(signature: string): {
        parameters: string[]
        returnType: string
    } | null {
        // parse signatures like "(a: Int, b: Int): Int" or "(): Int"
        const match = /\(([^)]*)\):\s*(.+)/.exec(signature)
        if (!match) return null

        const [, paramStr, returnType] = match
        const parameters: string[] = []

        if (paramStr.trim()) {
            const paramParts = paramStr.split(",")
            for (const part of paramParts) {
                const typeMatch = /:\s*(.+)/.exec(part.trim())
                if (typeMatch) {
                    parameters.push(typeMatch[1].trim())
                }
            }
        }

        return {
            parameters,
            returnType: returnType.trim(),
        }
    }
}
