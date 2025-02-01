const CODE_FENCE = "```"

export function generateKeywordDoc(word: string): string | null {
    if (word === "initOf") {
        return `${CODE_FENCE}tact
initOf ContractName(Arguments)
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

See more details in documentation: https://docs.tact-lang.org/book/expressions/#initof
`
    }

    return null
}
