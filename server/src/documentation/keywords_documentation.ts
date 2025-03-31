const CODE_FENCE = "```"

/**
 * Produces a Markdown Tact code block from a given word
 */
export function generateKeywordDoc(word: string): string | null {
    if (word === "initOf") {
        return `
The expression \`initOf\` computes initial state, i.e. \`StateInit\` of a contract:

${CODE_FENCE}tact
//                     argument values of contract or init() parameters
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
        return `
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
        return `
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
        return `
The top-level \`primitive\` declaration is used to introduce a non-composite type,
which is useful primarily in Tact's standard library and its tests:

${CODE_FENCE}tact
primitive Int;
primitive Cell;
${CODE_FENCE}
`
    }

    if (word === "import") {
        return `
The top-level \`import\` keyword is used to include everything from a local file or standard library:

${CODE_FENCE}tact
import "@stdlib/deploy"; // everything from the standard library
import "./utils";        // everything from a local file (utils.tact)
import "./file.fc";      // everything from a local FunC file (file.fc)
${CODE_FENCE}

Import statements must be placed at the beginning of a file before any other constructs.

Learn more in documentation: https://docs.tact-lang.org/book/import
`
    }

    if (word === "struct") {
        return `
The top-level \`struct\` keyword creates a user-defined composite type:

${CODE_FENCE}tact
struct Point {
    x: Int as uint8;
    y: Int as uint8 = 0;
}
${CODE_FENCE}

Learn more in documentation: https://docs.tact-lang.org/book/structs-and-messages#structs
`
    }

    if (word === "message") {
        return `
The top-level \`message\` keyword creates a user-defined composite type:

${CODE_FENCE}tact
message(42) Point {
    x: Int as uint8;
    y: Int as uint8 = 0;
}
${CODE_FENCE}

Unlike regular structs, message structs have a 32-bit integer header in their
serialization containing their unique numeric ID (opcode). This allows contracts
to differentiate incoming messages in receiver functions by message opcodes.

Learn more in documentation: https://docs.tact-lang.org/book/structs-and-messages#messages
`
    }

    if (word === "contract") {
        return `
The top-level \`contract\` keyword defines a contract with its persistent state variables,
receiver functions, getters, and internal functions:

${CODE_FENCE}tact
contract SimpleCounter(counter: Int as uint32) {
    // Empty receiver for the deployment
    receive() {
        // Forward the remaining value in the
        // incoming message back to the sender
        cashback(sender());
    }

    // Receive function handles certain incoming messages
    receive(msg: Add) {
        self.counter += msg.amount;

        // Forward the remaining value in the
        // incoming message back to the sender
        cashback(sender());
    }

    // Getter function allows reading parts of the contract state off-chain
    get fun counter(): Int {
        return self.counter;
    }
}

message Add { amount: Int as uint32 }
${CODE_FENCE}

Learn more in documentation: https://docs.tact-lang.org/book/contracts
`
    }

    if (word === "trait") {
        return `
The top-level \`trait\` keyword defines a trait, which is a reusable collection
of persisten state variables (contract fields), constants, and various functions
that can be inherited by other traits or by contracts:

${CODE_FENCE}tact
trait CustomOwnable {
    // A persistent state variable that the contract would inherit with this trait
    owner: Address;

    // An internal function that can be overridden
    virtual fun requireOwner() {
        require(sender() == self.owner, "Only owner is allowed to call this function");
    }
}

contract Showcase(
    owner: Address, // inherited from trait CustomOwnable
) with CustomOwnable {
    receive() {
        // Call an internal function inherited from a trait
        self.requireOwner();
    }
}
${CODE_FENCE}

Traits have the same structure as contracts, but they cannot initialize
persistent state variables with default values or via an init() function.

Learn more in documentation: https://docs.tact-lang.org/book/types#traits
`
    }

    if (word === "with") {
        return `
The \`with\` keyword allows contracts to inherit traits, which are reusable collections
of persistent state variables (contract fields), constants and various functions:

${CODE_FENCE}tact
contract Contract(
    field1: Int, // inherited from Trait1 via 'with' keyword
    field2: Int, // inherited from Trait2 via 'with' keyword
) with Trait1, Trait2 {
    // Inherited internal 'add()' and 'mul()' functions,
    // which can be overridden if needed
}

trait Trait1 {
    field1: Int;

    virtual fun add(val: Int): Int {
        return self.field1 + val;
    }
}

trait Trait2 {
    field2: Int;

    virtual fun mul(val: Int): Int {
        return self.field2 * val;
    }
}
${CODE_FENCE}

Learn more in documentation: https://docs.tact-lang.org/book/contracts#traits
`
    }

    if (word === "true") {
        return `
The literal \`false\` represents a value of type \`Bool\` indicating logical truth:

${CODE_FENCE}tact
let a: Bool = true;
let b = false;
let c = a && b; // false
let d = a || b; // true
let e = !a;     // false
${CODE_FENCE}

Learn more in documentation: https://docs.tact-lang.org/book/types#booleans
`
    }

    if (word === "false") {
        return `
The literal \`false\` represents a value of type \`Bool\` indicating logical falsehood:

${CODE_FENCE}tact
let a: Bool = false;
let b = true;
let c = a && b; // false
let d = a || b; // true
let e = !a;     // true
${CODE_FENCE}

Learn more in documentation: https://docs.tact-lang.org/book/types#booleans
`
    }

    if (word === "const") {
        return `
The \`const\` keyword defines a global, a trair or a contract constant value
obtained by evaluating a compile-time expression:

${CODE_FENCE}tact
// Global constant
const ZAP: Int = ascii("⚡"); // compile-time expression

trait Constants {
    // Trait constant, can be inherited in contracts
    const PLANET_RADIUS_KM: Int = 6378;
}

contract Mars() with Constants {
    // Contract constant
    const MIN_VALUE: Int = 100 + ZAP;

    // Overriding an inherited constant from a trait
    override const PLANET_RADIUS_KM: Int = 3396;

    // Empty receiver for the deployment
    receive() {
        let value = self.MIN_VALUE + ZAP + self.PLANET_RADIUS_KM;
    }
}
${CODE_FENCE}

Learn more in documentation: https://docs.tact-lang.org/book/constants
`
    }

    if (word === "fun") {
        return `
The \`fun\` keyword declares a function, which can be global, internal to traits
and contracts, a getter, or an an extension for a specific type:

${CODE_FENCE}tact
// Global function
fun add(a: Int, b: Int): Int {
    return a + b;
}

// Extension function
extends fun raiseTo(self: Int, power: Int): Int {
    return pow(self, power);
}

contract Showcase(
    owner: Address,
) {
    // Internal contract function
    fun requireOwner() {
        require(sender() == self.owner, "Only owner is allowed to call this function");
    }

    // Getter function, which can be called off-chain
    get fun owner(): Address {
        return self.owner;
    }
}
${CODE_FENCE}

Learn more in documentation: https://docs.tact-lang.org/book/functions
`
    }

    if (word === "native") {
        return `
The top-level \`native\` keyword declares a global Tact function through a
binding to an imported FunC function, providing simple and direct access
to existing code bases:

${CODE_FENCE}tact
// This Tact function 'getData()' is a binding to the FunC function 'get_data()',
// which can be located in the imported sources or in the auto-imported stdlib.fc
@name(get_data)
native getData(): Cell;

// They can be used like regular Tact functions
fun example() {
    getData(); // a Cell with the contract's persistent state data
}
${CODE_FENCE}

Learn more in documentation: https://docs.tact-lang.org/book/functions
`
    }

    if (word === "@name") {
        return `
The annotation \`@name\` binds a FunC function identifier to its Tact counterpart
in the native function definition:

${CODE_FENCE}tact
@name(get_data) // the 'get_data()' here is a FunC function identifier
native getData(): Cell;
${CODE_FENCE}

Learn more in documentation: https://docs.tact-lang.org/book/functions
`
    }

    if (word === "asm") {
        return `
The top-level \`asm\` keyword defines an assembly-level function that allows
writing TVM assembly directly in Tact, with the support of parameter and return
value arrangements:

${CODE_FENCE}tact
// An assembly function binding to a TVM instruction DIV
asm fun muldiv(a: Int, b: Int, c: Int): Int {
    MULDIV // (a * b) / c, with rounding down
}

// The '->' here distinguishes arrangement of 's' and 'len' parameters
// from the arrangement of s1 and s0 stack registers for return values
asm(s len -> 1 0) fun asmLoadInt(len: Int, s: Slice): SliceInt { LDIX }
${CODE_FENCE}

These are very advanced functions that require experience and vigilance
in both definitions and usage. Logical errors in them are extremely hard to spot,
and error messages are abysmal. Proceed only if you know what you're doing.

Learn more in documentation: https://docs.tact-lang.org/book/assembly-functions
`
    }

    if (word === "->") {
        return `
The symbol \`->\` in Tact is used within assembly functions to visually separate
the arrangement of function parameters and the arrangement of return values:

${CODE_FENCE}tact
// The '->' here distinguishes arrangement of 's' and 'len' parameters
// from the arrangement of s1 and s0 stack registers for return values
asm(s len -> 1 0) fun asmLoadInt(len: Int, s: Slice): SliceInt { LDIX }

// If there's an arrangement of return values, it must be prefixed by the '->' symbol
asm(-> 1 0) extends fun asmLoadCoins(self: Slice): SliceInt { LDVARUINT16 }

// A helper struct
struct SliceInt { s: Slice; val: Int }
${CODE_FENCE}

Learn more in documentation: https://docs.tact-lang.org/book/assembly-functions#arrangements
`
    }

    // Keywords within statements

    if (word === "let") {
        return `
The \`let\` statement defines local and block-scoped variables:

${CODE_FENCE}tact
// A variable of type Int
let x: Int = 42;

// Type ascriptions are optional for most cases,
// and the type will be inferred from the initial value
let y = 27;

// However, you must specify the type for maps and optionals
// because they default to null and cannot be inferred
let m: map<Int, Int> = emptyMap();
let opt: Int? = x + y;
${CODE_FENCE}

Learn more in documentation: https://docs.tact-lang.org/book/statements#let
`
    }

    // A pseudo-keyword for the destruct_statement node type
    if (word === "let_destruct") {
        return `
The destructuring \`let\` statement unpacks fields of structures into distinct variables:

${CODE_FENCE}tact
struct Point { x: Int; y: Int }

fun showcase() {
    let point = Point { x: 5, y: 25 };
    // Destructuring let statement, which defines
    // a variable secondComponent from the field y
    let Point { y: secondComponent, .. };
    secondComponent; // 25
}
${CODE_FENCE}

Learn more in documentation: https://docs.tact-lang.org/book/statements#destructuring-assignment
`
    }

    if (word === "return") {
        return `
The \`return\` statement stops the execution of the current function and,
optionally, produces some results that match the function's return type:

${CODE_FENCE}tact
fun one() {
    return;
    // The following statements would throw
    // an "unreachable code" compiler error
    return;
}

fun two(): Int {
    let x = 42 + 27;
    let y = (x << 5) | 24;
    return y;
}
${CODE_FENCE}

Learn more in documentation: https://docs.tact-lang.org/book/statements#return
`
    }

    if (word === "if") {
        return `
The \`if\` statement conditionally executes the following block or the \`else\` block
depending on the resulting value of the specified condition:

${CODE_FENCE}tact
let x = true || (!false || !true);
if (x) {
    // executes this block if 'x' evaluates to true
} else {
    // executes this block if 'x' evaluates to false
}

// You can omit the 'else' block
if (x) {
    // executes this block if 'x' evaluates to true and does nothing otherwise
}

// You can further nest conditional branches after the 'else' keyword:
if (x) {}
else if (y) {}
else if (z) {}
else {}
${CODE_FENCE}

Learn more in documentation: https://docs.tact-lang.org/book/statements#if-else
`
    }

    if (word === "else") {
        return `
The \`else\` keyword allows specifying an alternative branch that is executed
when the condition in the \`if\` clause is false:

${CODE_FENCE}tact
let x = 1;
if (false) { // this block won't be executed
    x += 1000;
} else { // but this one — will
    x <<= 20;
}
x; // 1048576
${CODE_FENCE}

Learn more in documentation: https://docs.tact-lang.org/book/if-else
`
    }

    if (word === "try") {
        return `
The \`try\` statement allows executing a statement block with an optional following
\`catch\` statement to handle potential exceptions:

${CODE_FENCE}tact
let myMap: map<Int, Int> = emptyMap();
let val: Int? = null;

// Map access may fail at runtime if the key doesn't exist
try {
    // This will throw because 7 isn't in the map
    val = myMap.get(7)!!;
} catch (exitCode) {
    // The catch block that can catch runtime exit code integers
    // of an exceptions occured will roll back almost all changes
    // made in the try block, except for: codepage changes, gas usage counters, etc.
    exitCode; // 128: null reference exception
    val = 0; // set a default value
}
${CODE_FENCE}

Learn more in documentation: https://docs.tact-lang.org/book/statements#try-catch
`
    }

    if (word === "catch") {
        return `
The \`catch\` statement is used in combination with the prior \`try\` statement
to handle exceptions and capture their exit codes in the \`catch\` clause:

${CODE_FENCE}tact
let myMap: map<Int, Int> = emptyMap();
myMap.set(1, 100);

try {
    // Attempt to access a key that doesn't exist
    myMap.get(2)!!;
} catch (errorCode) {
    // This code executes if an exception occurs
    errorCode; // 128: null reference exception
}
${CODE_FENCE}

Learn more in documentation: https://docs.tact-lang.org/book/statements#try-catch
`
    }

    if (word === "repeat") {
        return `
The \`repeat\` loop statement executes a block of code a specified number of times:

${CODE_FENCE}tact
let count = 0;
repeat (5) {
    // Code here will run 5 times
    count += 1;
}
count; // 5
${CODE_FENCE}

Learn more in documentation: https://docs.tact-lang.org/book/statements#repeat-loop
`
    }

    if (word === "while") {
        return `
The \`while\` loop statement executes a block of code as long as
the given condition is \`true\`:

${CODE_FENCE}tact
let i = 0;
while (i < 5) {
    // This block will execute as long as i is less than 5
    i += 1;
}
i; // 5
${CODE_FENCE}

Learn more in documentation: https://docs.tact-lang.org/book/statements#while-loop
`
    }

    if (word === "do") {
        return `
The \`do...until\` loop statement executes a block of code at least once
and then continues until the condition in the \`until\` clause is \`true\`:

${CODE_FENCE}tact
let i = 0;
do {
    // This block always executes at least once
    // even if the condition is initially false
    i += 1;
} until (i > 5); // loop continues until condition is true
i; // 6
${CODE_FENCE}

Learn more in documentation: https://docs.tact-lang.org/book/statements#do-until-loop
`
    }

    if (word === "until") {
        return `
The \`until\` clause is used in combination with the prior \`do\` block
to continue executing it as long as the condition remains \`false\`:

${CODE_FENCE}tact
let i = 0;
do {
    // This block always executes at least once
    // even if the condition is initially false
    i += 1;
} until (i > 5); // loop continues until condition is true
i; // 6
${CODE_FENCE}

Learn more in documentation: https://docs.tact-lang.org/book/statements#do-until-loop
`
    }

    if (word === "foreach") {
        return `
The \`foreach\` loop statement executes a block of code for each entry in the given map,
capturing a key and a value from each map entry per iteration:

${CODE_FENCE}tact
let myMap: map<Int, Int> = emptyMap();
myMap.set(1, 100);
myMap.set(2, 200);
myMap.set(3, 300);

// 'key' and 'value' are named arbitrarily,
// you can provide different names for your keys and values
foreach (key, value in myMap) {
    // This block executes once for each key-value pair in the map
    key;   // access the current key (1, 2, or 3)
    value; // access the current value (100, 200, or 300)
}

// Use wildcards to ignore key, value, or whole entries
foreach (k, _ in myMap) {
    k; // access the current key (1, 2, or 3),
    // but the value of the entry is discarded due to the wildcard _
}
${CODE_FENCE}

Learn more in documentation: https://docs.tact-lang.org/book/statements#foreach-loop
`
    }

    if (word === "in") {
        return `
The keyword \`in\` is used in the \`foreach\` loop to indicate the map being iterated:

${CODE_FENCE}tact
let myMap: map<Int, Int> = emptyMap();
myMap.set(1, 100);
myMap.set(2, 200);

// The 'in' keyword separates the iteration variables from the map name
foreach (key, value in myMap) {
    key;   // current key
    value; // current value
}
${CODE_FENCE}

Learn more in documentation: https://docs.tact-lang.org/book/statements#foreach-loop
`
    }

    // Keywords within type ascriptions

    if (word === "as") {
        return `
The keyword \`as\` is used for specifying serialization formats for values in the contract's
persistent state and (de)serializing structs and message structs to and from message body Cells:

${CODE_FENCE}tact
struct Point {
    x: Int as uint32; // 32-bit unsigned integer
    y: Int as coins;  // variable-width format for nanoToncoin
}

contract Pointy(
    val1: Int as uint7,   // you can specify odd values too
    val2: Int as uint240, // anything works as long as its within the boundaries
                          // of the 257-bit signed or 256-bit unsigned integer type
) {}
${CODE_FENCE}

Common type ascriptions include:
- \`as uint8\`, \`as uint16\`, \`as uint32\`, \`as uint64\`, \`as uint256\`
- \`as coins\` for nanoToncoin amounts

Learn more in documentation: https://docs.tact-lang.org/book/integers#serialization`
    }

    if (word === "map") {
        return `
The composite type \`map<K, V>\` associates keys of type \`K\` with corresponding
values of type \`V\`, creating a collection of key-value pairs:

${CODE_FENCE}tact
let m1: map<Int, Bool> = emptyMap(); // empty map from Int to Bool
m1.set(42, true);
m1.set(27, false);
m1.exists(42)
    ? m2.exists(27)
        ? m1.get(42)!! || m2.get(27)!!
        : null
    : null;
${CODE_FENCE}

Learn more in documentation: https://docs.tact-lang.org/book/maps
`
    }

    if (word === "bounced") {
        return `
The special type constructor \`bounced<M>\` is used within bounced message receivers
to construct a partial representation of the message body to fit in 256 bit limits:

${CODE_FENCE}tact
// First 32 bits are taken by the message opcode,
// so the bounced message body would only have 224 usable bits left
message Add {
    field1: Int as uint 224 = 0xBABECAFE;
    field2: Int = 0xDEADBEEF;
}

contract Example {
    bounced(msg: bounced<Add>) {
        // Only the field1 is accessible — subsequent ones are not
        msg.field1;
    }
}
${CODE_FENCE}

Learn more in documentation: https://docs.tact-lang.org/book/bounced
`
    }

    // In context of type ascription only and is unrelated to ternary operators
    if (word === "?") {
        return `
The \`?\` in the type ascription denotes an optional type which can hold \`null\` value
in addition to the value of the non-optional type of that type ascription:

${CODE_FENCE}tact
let valOr: Int? = 5;
if (valOr != null) {
    valOr!!; // 5
}
valOr = null;
${CODE_FENCE}

Learn more in documentation: https://docs.tact-lang.org/book/optionals
`
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
                return `
The annotation \`@interface\` can be applied to contracts to extend their \`supported_interfaces\` getter:

${CODE_FENCE}tact
@interface("org_or_project_name.counter")
contract Counter {}
${CODE_FENCE}

The \`supported_interfaces\` getter composed from \`@interface\` annotations is an optional,
off-chain, and verifiable promise indicating that a contract might contain some specific
code or public interfaces.

Learn more in documentation: https://docs.tact-lang.org/book/contracts#interfaces
`
            }
            case "trait": {
                return `
The annotation \`@interface\` can be applied to traits to extend their \`supported_interfaces\` getter:

${CODE_FENCE}tact
@interface("org.ton.ownable")
trait Ownable {}
${CODE_FENCE}

The \`supported_interfaces\` getter composed from \`@interface\` annotations is an optional,
off-chain, and verifiable promise indicating that a trait might contain some specific
code or public interfaces.

Learn more in documentation: https://docs.tact-lang.org/book/contracts#interfaces
`
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
                    return `
The attribute \`get\` defines a contract-level getter function
that can be called off-chain to read contract's state:

${CODE_FENCE}tact
contract Example(val: Int) {
    // Returns values of all persistent state variables of this contract
    get fun state(): Example {
        return self;
    }

    // Parameters and arbitrary return types are allowed too
    get fun valPlus(val2: Int): Int {
        // You can perform some calculations that do not affect the contract's state
        return self.val + val2;
    }
}
${CODE_FENCE}

Getter functions are read-only and cannot modify contract state.

Learn more in documentation: https://docs.tact-lang.org/book/functions
`
                }
                case "inline": {
                    return `
The attribute \`inline\` defines a function that is inlined at each call site during compilation:

${CODE_FENCE}tact
contract Example() {
    // This function will be inlined at each call site
    inline fun add(a: Int, b: Int): Int {
        return a + b;
    }

    receive("test") {
        let c = self.add(1, 2); // The function code is inlined here
    }
}
${CODE_FENCE}

Inlining functions can reduce gas consumption by removing the function call overhead,
but may increase the compiled contract size if the function is called from multiple places.

Learn more in documentation: https://docs.tact-lang.org/book/functions
`
                }
                case "extends": {
                    return `
The attribute \`extends\` allows a top-level, global function to extend values of a certain type:

${CODE_FENCE}tact
// This defines an extension function for the type Int
extends fun customPow(self: Int, c: Int): Int {
    let res: Int = 1;
    repeat(c) {
        res *= self;
    }
    return res;
}

fun showcase() {
    // Then, you can call that extension function on any values of the Int type:
    5.customPow(2); // 25
}
${CODE_FENCE}

Extension functions allow adding functionality to builtin types, structs and message structs,
but do not allow mutations. For those, use extension mutation functions with an
additional \`mutates\` attribute applied.

Learn more in documentation: https://docs.tact-lang.org/book/functions
`
                }
                case "mutates": {
                    return `
The attribute \`mutates\` allows an extension functions with an \`extends\`
attribute to mutate values of a certain type:

${CODE_FENCE}tact
// This defines an extension mutation function for the type Int
extends mutates fun customPow(self: Int, c: Int) {
    let res: Int = 1;
    repeat(c) {
        res *= self;
    }
    self = res;
}

fun showcase() {
    // Then, you can call that extension mutation function on any values of the Int type:
    let val: Int = 5;
    val.customPow(2);
    val; // 25
}
${CODE_FENCE}

Extension mutation functions allow mutations by replacing the original value with the execution result.

Learn more in documentation: https://docs.tact-lang.org/book/functions
`
                }
                case "virtual": {
                    return `
The attribute \`virtual\` allows a function to be overridden in derived contracts or traits:

${CODE_FENCE}tact
trait Baseline {
    virtual fun increment(val: Int): Int {
        return val + 1;
    }
}

contract Implementation with Baseline {
    override fun increment(val: Int): Int {
        return val + 2; // Different implementation
    }
}
${CODE_FENCE}

Learn more in documentation: https://docs.tact-lang.org/book/functions
`
                }
                case "override": {
                    return `
The attribute \`override\` allows overriding an inherited function from derived contracts or traits:

${CODE_FENCE}tact
trait Baseline {
    virtual fun increment(val: Int): Int {
        return val + 1;
    }
}

contract Implementation with Baseline {
    override fun increment(val: Int): Int {
        return val + 2; // Different implementation
    }
}
${CODE_FENCE}

Learn more in documentation: https://docs.tact-lang.org/book/functions
`
                }
                case "abstract": {
                    return `
The attribute \`abstract\` does not allow defining the function body upon declaration,
requiring it to be overridden in derived contracts or traits:

${CODE_FENCE}tact
trait Baseline {
    // Declaration only
    abstract fun increment(val: Int): Int;
}

contract Implementation with Baseline {
    // Specific implementation
    override fun increment(val: Int): Int {
        return val + 2;
    }
}
${CODE_FENCE}

Learn more in documentation: https://docs.tact-lang.org/book/functions
`
                }
                default: {
                    return null
                }
            }
        }
        case "const": {
            switch (word) {
                case "virtual": {
                    return `
The attribute \`virtual\` allows a constant to be overridden in derived contracts or traits:

${CODE_FENCE}tact
trait Baseline {
    virtual const MIN_VALUE: Int = ascii("⚡"); // compile-time expression
}

contract Implementation with Baseline {
    override const MIN_VALUE: Int = 20; // constant from the Baseline trait
}
${CODE_FENCE}

Learn more in documentation: https://docs.tact-lang.org/book/constants
`
                }
                case "override": {
                    return `
The attribute \`override\` allows overriding an inherited constant from derived contracts or traits:

${CODE_FENCE}tact
trait Baseline {
    virtual const MIN_VALUE: Int = ascii("⚡"); // compile-time expression
}

contract Implementation with Baseline {
    override const MIN_VALUE: Int = 20; // constant from the Baseline trait
}
${CODE_FENCE}

Learn more in documentation: https://docs.tact-lang.org/book/constants
`
                }
                case "abstract": {
                    return `
The attribute \`abstract\` does not allow specifying a value of the constant upon declaration,
requiring it to be overridden in derived contracts or traits:

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
