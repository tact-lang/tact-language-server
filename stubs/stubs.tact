/// Checks the condition and throws an error with an exit code generated from the
/// error message if the condition is false. Does nothing otherwise.
///
/// The algorithm for generating the exit code works as follows:
/// - First, the SHA-256 hash of `error` message String is obtained.
/// - Then, its value is read as a 32-bit big-endian number modulo 63000 plus 1000,
///   in that order.
/// - Finally, it's put into the `.md` compilation report file, which resides with the
///   other compilation artifacts in your project's `outputs/` or `build/` directories.
///
/// The generated exit code is guaranteed to be outside the common 0−255 range reserved
/// for TVM and Tact contract errors, which makes it possible to distinguish exit codes
/// from `require()` and any other standard exit codes.
///
/// Usage examples:
/// ```tact
/// // now() has to return a value greater than 1000, otherwise an error message
/// // will be thrown
/// require(now() > 1000, "We're in the first 1000 seconds of 1 January 1970!");
///
/// try {
///     // The following will never be true, so this require would always throw
///     require(now() < -1, "Time is an illusion. Lunchtime doubly so.");
/// } catch (e) {
///     // e will be outside of range 0-255
///     dump(e);
/// }
/// ```
fun require(that: Bool, msg: String) {}

/// Prints the argument arg to the contract's debug console. Evaluated only if the `debug`
/// option in the configuration file is set to `true`, otherwise does nothing.
///
/// This function is computationally expensive and consumes a lot of gas because it prints
/// the location from which it was called, i.e. the filename, line and column numbers, and
/// the original expression that was the arg argument.
///
/// Can be applied to the following list of types and values:
/// - `Int`
/// - `Bool`
/// - `Address`
/// - `Cell`, `Builder` or `Slice`
/// - `String` or `StringBuilder`
/// - `map<K, V>`
/// - Optionals and `null` value
/// - `void`, which is implicitly returned when a function doesn't have return value defined
fun dump(arg: _) {}

/// A compile-time function that converts the given Toncoins `value` from a human-readable
/// format `String` to the nanoToncoin `Int` format.
///
/// Usage example:
/// ```tact
/// contract Example {
///     // Persistent state variables
///     one: Int = ton("1");            // one Toncoin, which is equivalent to 10^9 nanoToncoins
///     pointOne: Int = ton("0.1");     // 0.1 Toncoin, which is equivalent to 10^8 nanoToncoins
///     nano: Int = ton("0.000000001"); // 10^-9 Toncoins, which is equivalent to 1 nanoToncoin
///                                     // works at compile-time!
/// }
/// ```
fun ton(value: String): Int {}

/// Pseudo-type that represents any struct.
primitive AnyStruct;

/// Converts any struct to its underlying `Cell` representation.
///
/// Usage example:
/// ```tact
/// struct Example {
///     field: Int;
/// }
///
/// fun example() {
///     let cell = Example{ field: 1 }.toCell();
/// }
/// ```
fun toCell(self: AnyStruct): Cell {}

/// Creates an empty map of type `map<K, V>`.
///
/// Usage example:
/// ```tact
/// fun example() {
///     let entries: map<Int, String> = emptyMap();
///     //           ^^^^^^^^^^^^^^^^ note that you need to specify the key and 
///     //                            value types in the type annotation when 
///     //                            declaring the map variable
/// }
/// ```
///
/// Note: On TVM, maps are represented as `Cell` type, which is very gas-intensive.
fun emptyMap(): map<K, V> {}

/// Sets or replaces a value under a key in the map.
extends mutates fun set(self: map<K, V>, key: K, val: V) {}

/// Gets a value by its key from the map. Returns null if the key is missing,
/// or the value if the key is found.
extends fun get(self: map<K, V>, key: K): V? {}

/// Replaces a value under the specified key if such key exists.
/// Returns true on successful replacement and false otherwise.
extends mutates fun replace(self: map<K, V>, key: K, val: V): Bool {}

/// Like `replace()`, but returns the old (pre-replacement) value on successful replacement 
/// and null otherwise.
extends mutates fun replaceGet(self: map<K, V>, key: K, val: V): V? {}

/// Deletes a single key-value pair (single entry) from the map.
/// Returns true in case of successful deletion and false otherwise.
extends mutates fun del(self: map<K, V>, key: K): Bool {}

/// Returns true if the value under the given key exists in the map and false otherwise.
/// Note: More gas-efficient than checking `get(key) != null`.
extends fun exists(self: map<K, V>, key: K): Bool {}

/// Returns true if the map is empty and false otherwise.
extends fun isEmpty(self: map<K, V>): Bool {}

/// Returns true if all entries of the map match corresponding entries of another map,
/// ignoring possible differences in the underlying serialization logic.
/// Returns false otherwise.
/// Note: Very gas expensive, `prefer == operator` for simple comparisons.
extends fun deepEquals(self: map<K, V>, other: map<K, V>): Bool {}

/// Converts the map to its underlying `Cell` representation.
/// Since maps are initialized to null, calling `asCell()` on a map with no values 
/// assigned will return null and **not** an empty `Cell`.
extends fun asCell(self: map<K, V>): Cell {}
