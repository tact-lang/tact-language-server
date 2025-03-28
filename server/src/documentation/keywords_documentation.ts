const CODE_FENCE = "```"

/**
 * Produces a Markdown Tact code block from a given word
 */
export function generateKeywordDoc(word: string): string | null {
    if (word === "initOf") {
        return `${CODE_FENCE}tact
initOf ContractName(...arguments)
${CODE_FENCE}

The expression \`initOf\` computes initial state, i.e. \`StateInit\` of a contract:

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

Learn more in documentation: https://docs.tact-lang.org/book/expressions#initof
`
    }

    if (word === "codeOf") {
        return `${CODE_FENCE}tact
codeOf ContractName
${CODE_FENCE}

The expression \`codeOf\` returns a \`Cell\` containing the code of a contract:

${CODE_FENCE}tact
codeOf ExampleContract; // a Cell with ExampleContract code
//     ---------------
//     ↑
//     name of the contract
${CODE_FENCE}

Learn more in documentation: https://docs.tact-lang.org/book/expressions#codeof
`
    }

    if (word === "null") {
        return `${CODE_FENCE}tact
null
${CODE_FENCE}

The literal \`null\` represents the intentional absence of value:

${CODE_FENCE}tact
let var: Int? = null; // variable which can hold a null value
var = 42;
if (var != null) {
    var!! + var!!;
}
${CODE_FENCE}

Learn more in documentation: https://docs.tact-lang.org/book/expressions#null-literal
`
    }

    if (word === "primitive") {
        return `${CODE_FENCE}tact
primitive TypeIdentifier;
${CODE_FENCE}

The top-level \`primitive\` declaration is used to introduce a non-composite type,
which is useful primarily in Tact's standard library and its tests:

${CODE_FENCE}tact
primitive Int;
primitive Cell;
${CODE_FENCE}
`
    }

    if (word === "import") {
        return `${CODE_FENCE}tact
import "...";
${CODE_FENCE}

The top-level \`import\` keyword is used to include everything from local file or standard library:

${CODE_FENCE}tact
import "@stdlib/deploy"; // imports from the standard library
import "./utils";        // imports from a local file (utils.tact)
import "./file.fc";      // imports from a local FunC file (file.fc)
${CODE_FENCE}

Import statements must be placed at the beginning of a file before any other constructs.

Learn more in documentation: https://docs.tact-lang.org/book/import
`
    }

    // TODO: TODO: TODO: TODO: edit and refine
    if (word === "struct") {
        return `${CODE_FENCE}tact
struct StructIdentifier { /* field definitions */ }
${CODE_FENCE}

The top-level \`struct\` keyword creates a user-defined composite type:

${CODE_FENCE}tact
// TODO: better example!
struct Point {
    x: Int;
    y: Int;
}

let p: Point = Point{x: 10, y: 20};
let offsetX: Int = p.x + 5;
${CODE_FENCE}

TODO: ...
Structs can be used for data storage, as message types, and as return values from functions.

Learn more in documentation: https://docs.tact-lang.org/book/structs-and-messages#structs
`
    }

    // TODO: same as before, but now with a opcode header and a simplified msg model
    if (word === "message") {
        return `Defines a message struct.`
    }

    // TODO:
    if (word === "contract") {
        return `${CODE_FENCE}tact
contract ContractIdentifier(/* parameters */) { /* receivers, getters and methods */ }
${CODE_FENCE}

The top-level \`contract\` keyword defines a contract with its state variables and methods:

${CODE_FENCE}tact
contract Counter {
    // State variables are stored in persistent contract storage
    val: Int;

    // Constructor initializes the contract state
    init(initVal: Int) {
        self.val = initVal;
    }

    // Receive function handles incoming messages
    receive("increment") {
        self.val = self.val + 1;
    }

    // Getter function allows reading state without sending messages
    get fun value(): Int {
        return self.val;
    }
}
${CODE_FENCE}

Learn more in documentation: https://docs.tact-lang.org/book/contracts
`
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

    // TODO: ...
    if (word === "const") {
        return ``
    }

    // TODO: ...
    if (word === "fun") {
        return ``
    }

    // TODO:
    if (word === "native") {
        return ``
    }

    // TODO:
    if (word === "@name") {
        return ``
    }

    // TODO:
    if (word === "asm") {
        return ``
    }

    // TODO:
    if (word === "->") {
        return ``
    }

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

    // TODO:
    if (word === "in") {
        return ``
    }

    // Keywords within type ascriptions

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
    if (word === "@interface") {
        switch (anno) {
            case "contract": {
                // TODO: ...
                return `${CODE_FENCE}tact
@interface("org.ton.test")
contract ContractName {}
${CODE_FENCE}

The annotation \`@interface\` can be applied to contracts to define a unique interface identifier:

${CODE_FENCE}tact
@interface("org.ton.counter")
contract Counter {
    val: Int;

    init(initVal: Int) {
        self.val = initVal;
    }

    receive("increment") {
        self.val = self.val + 1;
    }

    get fun value(): Int {
        return self.val;
    }
}
${CODE_FENCE}

TODO: ... determine this, ok. And put to trait.
Interface identifiers help with contract verification and interaction, ensuring that a contract follows a specific interface standard.

Learn more in documentation: https://docs.tact-lang.org/book/contracts#contract-annotations
`
            }
            case "trait": {
                // TODO: ...
                return ``
            }
            default: {
                throw new Error("Unreachable!")
            }
        }
    }

    return null
}

/**
 * Produces a Markdown Tact code block from a given attribute keyword
 *
 * @param attr The `word` serves as an attribute **near** this keyword
 */
export function generateAttributeKeywordDoc(word: string, attr: "fun" | "const"): string | null {
    switch (attr) {
        case "fun": {
            switch (word) {
                case "get": {
                    return `${CODE_FENCE}tact
get fun getterName(): ReturnType { /* body */ }
${CODE_FENCE}

// TODO: ...
The attribute \`get\` defines a getter function that allows reading contract state without sending a message:

${CODE_FENCE}tact
contract Counter {
    val: Int;

    init(initVal: Int) {
        self.val = initVal;
    }

    // Getter function can be called via read methods
    get fun value(): Int {
        return self.val;
    }

    // Getters can take parameters
    get fun valueWithOffset(offset: Int): Int {
        return self.val + offset;
    }
}
${CODE_FENCE}

// TODO: ...
Getter functions are read-only and cannot modify contract state.

Learn more in documentation: https://docs.tact-lang.org/book/functions
`
                }
                case "inline": {
                    return ``
                }
                case "extends": {
                    return ``
                }
                case "mutates": {
                    return ``
                }
                case "virtual": {
                    return ``
                }
                case "override": {
                    return ``
                }
                case "abstract": {
                    return ``
                }
                default: {
                    return null
                }
            }
        }
        case "const": {
            switch (word) {
                case "virtual": {
                    return `${CODE_FENCE}tact
virtual const X: Int = 0;
${CODE_FENCE}

The attribute \`virtual\` allows a constant to be overridden in derived contracts or traits:

${CODE_FENCE}tact
trait Baseline {
    virtual const MIN_VALUE: Int = now(); // compile-time expression
}

contract Implementation with Baseline {
    override const MIN_VALUE: Int = 20; // constant from the Baseline trait
}
${CODE_FENCE}

Learn more in documentation: https://docs.tact-lang.org/book/constants
`
                }
                case "override": {
                    return `${CODE_FENCE}tact
override const X: Int = 42;
${CODE_FENCE}

The attribute \`override\` allows overriding an inherited constant from derived contracts or traits:

${CODE_FENCE}tact
trait Baseline {
    virtual const MIN_VALUE: Int = now(); // compile-time expression
}

contract Implementation with Baseline {
    override const MIN_VALUE: Int = 20; // constant from the Baseline trait
}
${CODE_FENCE}

Learn more in documentation: https://docs.tact-lang.org/book/constants
`
                }
                case "abstract": {
                    return `${CODE_FENCE}tact
abstract const X: Int;
${CODE_FENCE}

The attribute \`abstract\` requires a constant to be overridden in derived contracts or traits,
and does not specifying its value upon declaration:

${CODE_FENCE}tact
trait Baseline {
    abstract const MIN_VALUE: Int; // the declaration part only
}

contract Implementation with Baseline {
    override const MIN_VALUE: Int = 20; // constant from the Baseline trait
}
${CODE_FENCE}

Learn more in documentation: https://docs.tact-lang.org/book/constants
`
                }
                default: {
                    return null
                }
            }
        }
        default: {
            throw new Error("Unreachable!")
        }
    }

    return null
}
