/// Checks the condition and throws an error with an exit code generated from the error message if the condition is false. Does nothing otherwise.
///
/// The algorithm for generating the exit code works as follows:
/// * First, the SHA-256 hash of `error` message String is obtained.
/// * Then, its value is read as a 32-bit big-endian number modulo 63000 plus 1000, in that order.
/// * Finally, it's put into the `.md` compilation report file, which resides with the other compilation artifacts in your project's `outputs/` or `build/` directories.
///
/// The generated exit code is guaranteed to be outside the common 0−255 range reserved for TVM and Tact contract errors, which makes it possible to distinguish exit codes from `require()` and any other standard exit codes.
///
/// ```tact
/// fun examples() {
///     // now() has to return a value greater than 1000, otherwise an error message
///     // will be thrown
///     require(now() > 1000, "We're in the first 1000 seconds of 1 January 1970!");
///
///     try {
///         // The following will never be true, so this require would always throw
///         require(now() < -1, "Time is an illusion. Lunchtime doubly so.");
///     } catch (e) {
///         // e will be outside of range 0-255
///         dump(e);
///     }
/// }
/// ```
///
/// See:
/// * https://docs.tact-lang.org/ref/core-debug/#require
/// * https://docs.tact-lang.org/book/compile/#report
///
fun require(that: Bool, msg: String);

/// Prints the argument `arg` to the contract's debug console. Evaluated only if the `debug` option in the configuration file is set to `true`, otherwise does nothing.
///
/// This function is computationally expensive and consumes a lot of gas because it prints the location from which it was called, i.e. the filename, line and column numbers, and the original expression that was the `arg` argument.
///
/// Can be applied to the following list of types and values:
/// * `Int`
/// * `Bool`
/// * `Address`
/// * `Cell`, `Builder` or `Slice`
/// * `String` or `StringBuilder`
/// * `map<K, V>`
/// * Optionals and `null` value
/// * `void`, which is implicitly returned when a function doesn't have return value defined
///
/// See:
/// * https://docs.tact-lang.org/ref/core-debug/#dump
/// * https://docs.tact-lang.org/book/config/#options-debug
///
fun dump(arg: T);

/// Prints the total stack depth and up to 255 of its values from the top to the contract's debug console. The values are positioned bottom-up: from the deepest value on the left to the topmost value on the right. Evaluated only if the `debug` option in the configuration file is set to `true`, otherwise does nothing.
///
/// ```tact
/// fun example() {
///     dumpStack(); // prints:
///                  // File filename.tact:1:1
///                  // dumpStack()
///                  // stack(3 values) : 100000000 C{96...C7} 0
/// }
/// ```
///
/// See:
/// * https://docs.tact-lang.org/ref/core-debug/#dumpstack
/// * https://docs.tact-lang.org/book/config/#options-debug
///
fun dumpStack();

/// Computes and returns the SHA-256 hash as a 256-bit unsigned `Int` from a passed `Slice` `data`, which should have a number of bits divisible by 8 and no more than a single reference per the cell level.
///
/// This function tries to resolve constant string values at compile-time whenever possible.
///
/// ```tact
/// fun example() {
///     sha256(beginCell().asSlice());
/// }
/// ```
///
/// See: https://docs.tact-lang.org/ref/core-math/#sha256
///
fun sha256(data: Slice): Int;

/// Computes and returns the SHA-256 hash as a 256-bit unsigned `Int` from a passed `String` `data`.
///
/// This function tries to resolve constant string values at compile-time whenever possible.
///
/// ```tact
/// fun example() {
///     sha256("Hello, world!");
/// }
/// ```
///
/// See: https://docs.tact-lang.org/ref/core-math/#sha256
///
fun sha256(data: String): Int;

/// A compile-time function that converts the given Toncoins `value` from a human-readable format `String` to the nanoToncoin `Int` format.
///
/// ```tact
/// contract Example {
///     // Persistent state variables
///     one: Int = ton("1");            // one Toncoin, which is equivalent to 10^9 nanoToncoins
///     pointOne: Int = ton("0.1");     // 0.1 Toncoin, which is equivalent to 10^8 nanoToncoins
///     nano: Int = ton("0.000000001"); // 10^-9 Toncoins, which is equivalent to 1 nanoToncoin
///                                     // works at compile-time!
/// }
/// ```
///
/// See: https://docs.tact-lang.org/ref/core-comptime/#ton
///
fun ton(value: String): Int;

/// Pseudo-type that represents any Struct.
primitive Struct;

/// Pseudo-type that represents any Message.
primitive Message;

/// Extension function for any Struct.
///
/// Converts the Struct to a `Cell` and returns it.
///
/// ```tact
/// struct GuessCoin {
///     probably: Int as coins;
///     nothing: Int as coins;
/// }
///
/// fun coinCell(): Cell {
///     let s: GuessCoin = GuessCoin{ probably: 42, nothing: 27 };
///     let fizz: Cell = s.toCell();
///
///     return fizz; // "x{12A11B}"
/// }
/// ```
///
/// See: https://docs.tact-lang.org/ref/core-cells/#structtocell
///
extends fun toCell(self: Struct): Cell;

/// Extension function for any Struct. Available since Tact 1.5.0.
///
/// Converts the Struct to a `Slice` and returns it. Alias to `self.toCell().asSlice()`.
///
/// ```tact
/// struct GuessCoin {
///     probably: Int as coins;
///     nothing: Int as coins;
/// }
///
/// fun coinSlice(): Slice {
///     let s: GuessCoin = GuessCoin{ probably: 42, nothing: 27 };
///     let fizz: Slice = s.toSlice();
///
///     return fizz; // "CS{Cell{000612a11b} bits: 0..24; refs: 0..0}"
/// }
/// ```
///
/// See: https://docs.tact-lang.org/ref/core-cells/#structtoslice
///
extends fun toSlice(self: Struct): Slice;

/// Extension function for any Message.
///
/// Converts the Message to a `Cell` and returns it.
///
/// ```tact
/// message GuessCoin {
///     probably: Int as coins;
///     nothing: Int as coins;
/// }
///
/// fun coinCell(): Cell {
///     let s: GuessCoin = GuessCoin{ probably: 42, nothing: 27 };
///     let fizz: Cell = s.toCell();
///
///     return fizz; // "x{AB37107712A11B}"
/// }
/// ```
///
/// See: https://docs.tact-lang.org/ref/core-cells/#messagetocell
///
extends fun toCell(self: Message): Cell;

/// Extension function for any Message. Available since Tact 1.5.0.
///
/// Converts the Message to a `Slice` and returns it. Alias to `self.toCell().asSlice()`.
///
/// ```tact
/// message GuessCoin {
///     probably: Int as coins;
///     nothing: Int as coins;
/// }
///
/// fun coinSlice(): Slice {
///     let s: GuessCoin = GuessCoin{ probably: 42, nothing: 27 };
///     let fizz: Slice = s.toSlice();
///
///     return fizz; // "CS{Cell{000eab37107712a11b} bits: 0..56; refs: 0..0}"
/// }
/// ```
///
/// See: https://docs.tact-lang.org/ref/core-cells/#messagetoslice
///
extends fun toSlice(self: Message): Slice;

/// Creates an empty map of type `map<K, V>`, initially set to `null`.
///
/// ```tact
/// fun example() {
///     let entries: map<Int, String> = emptyMap();
///     //           ^^^^^^^^^^^^^^^^ note that you need to specify the key and
///     //                            value types in the type annotation when
///     //                            declaring the map variable
/// }
/// ```
///
/// On TVM, maps are represented as a `Cell` type, which is very gas-intensive.
///
/// See: https://docs.tact-lang.org/book/maps/#emptymap
///
fun emptyMap(): map<K, V>;

/// Sets or replaces a value `val` under a `key` in the map.
///
/// See: https://docs.tact-lang.org/book/maps/#set
///
extends mutates fun set(self: map<K, V>, key: K, val: V);

/// Gets a value by its `key` from the map. Returns `null` if the `key` is missing, or the value if the `key` is found.
///
/// See: https://docs.tact-lang.org/book/maps/#get
///
extends fun get(self: map<K, V>, key: K): V?;

/// Replaces a value `val` under the specified `key` if such key exists. Returns `true` on successful replacement and `false` otherwise.
///
/// See: https://docs.tact-lang.org/book/maps/#replace
///
extends mutates fun replace(self: map<K, V>, key: K, val: V): Bool;

/// Like `replace()`, but returns the old (pre-replacement) value on successful replacement and `null` otherwise.
///
/// See: https://docs.tact-lang.org/book/maps/#replaceget
///
extends mutates fun replaceGet(self: map<K, V>, key: K, val: V): V?;

/// Deletes a single key-value pair (single entry) by its `key` from the map. Returns `true` in case of successful deletion and `false` otherwise.
///
/// See: https://docs.tact-lang.org/book/maps/#del
///
extends mutates fun del(self: map<K, V>, key: K): Bool;

/// Returns `true` if the value under the given `key` exists in the map and `false` otherwise.
/// This function is more gas-efficient than checking `self.get(key) != null`.
///
/// See: https://docs.tact-lang.org/book/maps/#exists
///
extends fun exists(self: map<K, V>, key: K): Bool;

/// Returns `true` if the map is empty and `false` otherwise.
///
/// See: https://docs.tact-lang.org/book/maps/#isempty
///
extends fun isEmpty(self: map<K, V>): Bool;

/// Returns `true` if all entries of the map match corresponding entries of another map, ignoring possible differences in the underlying serialization logic. Returns `false` otherwise.
/// This function is very gas expensive, `prefer == operator` for simple comparisons.
///
/// See: https://docs.tact-lang.org/book/maps/#deepequals
///
extends fun deepEquals(self: map<K, V>, other: map<K, V>): Bool;

/// Converts the map to its underlying `Cell` representation.
/// Since maps are initialized to `null`, calling `asCell()` on a map with no values assigned will return `null` and **not** an empty `Cell`.
///
/// See: https://docs.tact-lang.org/book/maps/#ascell
///
extends fun asCell(self: map<K, V>): Cell?;
