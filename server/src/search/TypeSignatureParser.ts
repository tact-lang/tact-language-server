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
            if (!this.query || this.query.trim() === "") {
                throw new Error("Type signature cannot be empty")
            }

            return this.parseSignature()
        } catch (error) {
            throw error instanceof Error ? error : new Error("Invalid type signature format")
        }
    }

    private parseSignature(): TypeSignature {
        const parameters = this.parseParameters()

        this.skipWhitespace()
        if (!this.consume("->")) {
            if (this.position >= this.query.length) {
                throw new Error("Invalid type signature format")
            }
            throw new Error("Invalid type signature format")
        }
        this.skipWhitespace()

        if (this.position >= this.query.length) {
            throw new Error("Invalid type signature format")
        }

        const returnType = this.parseType()

        this.skipWhitespace()
        if (this.position < this.query.length) {
            throw new Error("Invalid type signature format")
        }

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
            const isOptional = this.peek() === "?"
            if (isOptional) {
                this.consume("?")
            }
            return {kind: "wildcard", optional: isOptional}
        }

        const typeName = this.parseTypeName()
        if (!typeName) {
            throw new Error("Expected type name")
        }

        let fullTypeName = typeName

        if (this.peek() === "<") {
            this.consume("<")
            const generics = this.parseGenerics()
            this.consume(">")

            const genericStr = generics.map(g => this.typePatternToString(g)).join(", ")
            fullTypeName = `${typeName}<${genericStr}>`
        }

        const isOptional = this.peek() === "?"
        if (isOptional) {
            this.consume("?")
        }

        return {
            kind: "concrete",
            name: fullTypeName,
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

    private typePatternToString(pattern: TypePattern): string {
        if (pattern.kind === "wildcard") {
            return pattern.optional ? "_?" : "_"
        }

        let result = pattern.name ?? ""
        if (pattern.optional) {
            result += "?"
        }
        return result
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
                if (patternParam.optional) {
                    if (!functionParam || !functionParam.endsWith("?")) {
                        return false
                    }
                }
                continue
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
            if (pattern.optional) {
                return actualType.endsWith("?")
            }
            return true
        }

        if (!pattern.name) {
            return false
        }

        if (pattern.optional) {
            if (actualType === `${pattern.name}?`) {
                return this.matchesGenerics(actualType, pattern)
            }
            return false
        }

        if (actualType === pattern.name) {
            return this.matchesGenerics(actualType, pattern)
        }
        if (actualType.endsWith("?")) {
            return false
        }

        if (actualType.startsWith("map<") && pattern.name.startsWith("map<")) {
            return this.matchesMapType(actualType, pattern)
        }

        return false
    }

    private static matchesGenerics(actualType: string, pattern: TypePattern): boolean {
        if (!pattern.generics || pattern.generics.length === 0) {
            return true
        }

        const genericMatch = /<([^>]+)>/.exec(actualType)
        if (!genericMatch) {
            return false
        }

        const actualGenerics = this.parseGenericTypes(genericMatch[1])
        if (actualGenerics.length !== pattern.generics.length) {
            return false
        }

        for (let i = 0; i < pattern.generics.length; i++) {
            if (!this.matchesType(actualGenerics[i], pattern.generics[i])) {
                return false
            }
        }

        return true
    }

    private static matchesMapType(actualType: string, pattern: TypePattern): boolean {
        const actualMatch = /map<([^>]+)>/.exec(actualType)
        const patternMatch = /map<([^>]+)>/.exec(pattern.name ?? "")

        if (!actualMatch || !patternMatch) {
            return false
        }

        const actualGenerics = this.parseGenericTypes(actualMatch[1])
        const patternGenerics = this.parseGenericTypes(patternMatch[1])

        if (actualGenerics.length !== patternGenerics.length) {
            return false
        }

        // TODO: implement proper recursive type matching
        return actualMatch[1] === patternMatch[1]
    }

    private static parseGenericTypes(genericsStr: string): string[] {
        const types: string[] = []
        let depth = 0
        let current = ""

        for (const char of genericsStr) {
            if (char === "<") {
                depth++
                current += char
            } else if (char === ">") {
                depth--
                current += char
            } else if (char === "," && depth === 0) {
                types.push(current.trim())
                current = ""
            } else {
                current += char
            }
        }

        if (current.trim()) {
            types.push(current.trim())
        }

        return types
    }

    private static parseFunctionSignature(signature: string): {
        parameters: string[]
        returnType: string
    } | null {
        // parse signatures like "(a: Int, b: Int): Int", "(): Int", or "(a: Int)" for void functions
        const matchWithReturn = /\(([^)]*)\):\s*(.+)/.exec(signature)
        if (matchWithReturn) {
            const [, paramStr, returnType] = matchWithReturn
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

        // Handle void functions: "(a: Int)" or "()"
        const matchVoid = /\(([^)]*)\)$/.exec(signature)
        if (matchVoid) {
            const [, paramStr] = matchVoid
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
                returnType: "void",
            }
        }

        return null
    }
}
