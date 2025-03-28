const CODE_FENCE = "```"

/**
 * Produces a Markdown Tact code block from a given word
 *
 * @param _attr The `word` serves as an attribute **near** this keyword
 */
export function generateKeywordDoc(
    word: string,
    // _attr: "fun" | "const" | undefined,
): string | null {
    if (word === "initOf") {
        return `${CODE_FENCE}tact
initOf ContractName(...arguments)
${CODE_FENCE}

Expression \`initOf\` computes initial state, i.e. \`StateInit\` of a contract:

${CODE_FENCE}tact
//                     argument values for the init() function of the contract
//                     ↓   ↓
initOf ExampleContract(42, 100); // returns a Struct StateInit{}
//     ---------------
//     ↑
//     name of the contract
//     ↓
//     ---------------
initOf ExampleContract(
    42,  // first argument
    100, // second argument, trailing comma is allowed
);
${CODE_FENCE}

Learn more in documentation: https://docs.tact-lang.org/book/expressions/#initof
`
    }

    // TODO:
    if (word === "codeOf") {
        return `${CODE_FENCE}tact
Learn more in documentation: https://docs.tact-lang.org/book/expressions/#codeof`
    }

    // TODO:
    if (word === "null") {
        return ``
    }

    // TODO:
    if (word === "primitive") {
        return ``
    }

    // TODO:
    if (word === "import") {
        return ``
    }

    // TODO:
    if (word === "struct") {
        return ``
    }

    // TODO:
    if (word === "message") {
        return `Defines a message struct.`
    }

    // TODO:
    if (word === "contract") {
        return `Defines a contract.`
    }

    // TODO:
    if (word === "trait") {
        return `Defines a trait.`
    }

    // TODO:
    if (word === "with") {
        return `Inherits a trait.`
    }

    // TODO:
    if (word === "true") {
        return ``
    }

    // TODO:
    if (word === "false") {
        return ``
    }

    // TODO:
    if (word === "with") {
        return ``
    }

    // TODO: fun and attributes
    // TODO: const and attributes
    // TODO: native & asm (incl. ->)
    // TODO: @name

    // Keywords within statements

    // TODO:
    if (word === "let") {
        return ``
    }

    // TODO: a pseudo-keyword
    if (word === "let_destruct") {
        return ``
    }

    // TODO:
    if (word === "return") {
        return ``
    }

    // TODO:
    if (word === "if") {
        return ``
    }

    // TODO:
    if (word === "else") {
        return ``
    }

    // TODO:
    if (word === "try") {
        return ``
    }

    // TODO:
    if (word === "catch") {
        return ``
    }

    // TODO:
    if (word === "repeat") {
        return ``
    }

    // TODO:
    if (word === "while") {
        return ``
    }

    // TODO:
    if (word === "do") {
        return ``
    }

    // TODO:
    if (word === "until") {
        return ``
    }

    // TODO:
    if (word === "foreach") {
        return ``
    }

    // Keywords within type ascriptions

    // TODO:
    if (word === "in") {
        return ``
    }

    // TODO:
    if (word === "as") {
        return ``
    }

    // TODO:
    if (word === "map") {
        return ``
    }

    // TODO:
    if (word === "bounced") {
        return ``
    }

    // TODO:
    if (word === "?") {
        // ? -> An optional type, which allows setting this value to null.
        //      Learn more in documentation: ...link
        return ``
    }

    return null
}

/**
 * Produces a Markdown Tact code block from a given annotation keyword
 *
 * @param anno The `word` serves as an annotation **for** this keyword
 */
export function generateAnnotationKeywordDoc(
    word: string,
    anno: "contract" | "trait",
): string | null {
    // TODO:
    if (word === "@interface") {
        switch (anno) {
            case "contract": {
                return ``
            }
            case "trait": {
                return ``
            }
            default: {
                throw new Error("Unreachable!")
            }
        }
    }

    return null
}

// TODO: actually make another function that'll be used for:
// fun|const attributes
// and then simplify the common parts in server.ts

// TODO: move notes for this file in the next batch/commit.
// TODO: handle the docs for "self" keyword here, then augment them in docs.generateDocFor()
