# Inspections

This document describes available inspections in Language Server and their functionality.

Some inspections have auto-fix functionality.

All inspections are enabled by default. To disable an inspection, you can use the `tact.inspections.disabled` setting.

For example, to disable the `unused-import` inspection, you can add the following to your settings:

```json
{
    "tact.inspections.disabled": ["unused-import"]
}
```

## Table of Contents

### Performance Inspections

- [Can Be Standalone Function](#can-be-a-standalone-function)
- [Rewrite As Augmented Assignment](#rewrite-as-augmented-assignment)
- [Rewrite](#rewrite)
- [Don't Use Text Receivers](#dont-use-text-receivers)
- [Use Explicit String Receiver](#use-explicit-string-receiver)
- [Don't Use Deployable](#dont-use-deployable)

### Code Quality Inspections

- [Unused Import](#unused-import)
- [Unused Variable](#unused-variable)
- [Unused Parameter](#unused-parameter)
- [Struct Initialization](#struct-initialization)
- [Implicit Return Value Discard](#implicit-return-value-discard)
- [Empty Block](#empty-block)
- [Unused Contract Members](#unused-contract-members)

### Contract-specific Inspections

- [Missed Field in Contract](#missed-field-in-contract)

### Syntax and Compilation Inspections

- [Not Imported Symbol](#not-imported-symbol)

## Performance Inspections

### Can Be a Standalone Function

**ID**: `can-be-standalone-function`
**Severity**: Warning
**Category**: Performance
**Auto-fix**: Available

This inspection identifies contract methods that don't use contract state (don't use `self`) and can be extracted into
standalone functions for better performance.

**Before**:

```tact
contract Contract {
    owner: Address;

    fun bar(a: Int): Bool {
        return a == 10; // Doesn't use contract state
    }

    get fun owner(): Address {
        return self.owner; // Uses contract state
    }
}
```

**After**:

```tact
contract Contract {
    owner: Address;

    get fun owner(): Address {
        return self.owner;
    }
}

fun bar(a: Int): Bool {
    return a == 10; // Extracted as standalone function
}
```

**Note**: Only non-get methods that don't use contract state can be extracted as standalone functions. Get methods are
always part of the contract interface and cannot be extracted.

### Rewrite As Augmented Assignment

**ID**: `rewrite-as-augmented-assignment`
**Severity**: Hint
**Category**: Readability
**Auto-fix**: Available

Suggests using augmented assignment operators (like `+=`, `-=`, `*=`, etc.) instead of regular assignment with
arithmetic operations. This makes the code more concise and readable.

**Before**:

```tact
fun foo() {
    let a = 100;
    a = a + 10;
    a = a - 5;
    a = a * 2;
    a = a / 3;
    a = a % 4;
    a = a & 0xFF;
    a = a | 0x0F;
    a = a << 2;
    a = a >> 1;
}
```

**After**:

```tact
fun foo() {
    let a = 100;
    a += 10;
    a -= 5;
    a *= 2;
    a /= 3;
    a %= 4;
    a &= 0xFF;
    a |= 0x0F;
    a <<= 2;
    a >>= 1;
}
```

**Note**: The inspection also works with field access expressions (e.g., `a.field = a.field + 10` to `a.field += 10`)and
with reversed operand order (e.g., `a = 10 + a` to `a += 10`).

### Rewrite

**ID**: `rewrite`
**Severity**: Information
**Category**: Performance
**Auto-fix**: Available

Suggests rewriting certain code patterns for better performance or clarity. Current rewrites include:

- Replacing `context().sender` with `sender()`.
- Replacing `send(SendParameters { ... })` with `message(MessageParameters { ... })` or
  `deploy(DeployParameters { ... })` where applicable (since Tact 1.6.0).

**Example 1 (context().sender)**:
**Before**:

```tact
contract MyContract {
    fun foo() {
        let addr = context().sender;
    }
}
```

**After**:

```tact
contract MyContract {
    fun foo() {
        let addr = sender();
    }
}
```

**Example 2 (send to message)**:
**Before**:

```tact
contract MyContract {
    fun sendMessage(to: Address, amount: Int) {
        send(SendParameters{
            to: to,
            value: amount,
            body: "Hello"
        });
    }
}
```

**After**:

```tact
contract MyContract {
    fun sendMessage(to: Address, amount: Int) {
        message(MessageParameters{
            to: to,
            value: amount,
            body: "Hello"
        });
    }
}
```

### Don't Use Text Receivers

**ID**: `dont-use-text-receivers`
**Severity**: Warning
**Category**: Performance
**Auto-fix**: Not available

Warns against using text receivers in contract methods. Text messages are less efficient than binary messages and should
be avoided for better performance.

**Example**:

```tact
contract MyContract {
    // Warning: Using text messages is less efficient
    receive("increment") {
        counter = counter + 1;
    }

    // OK: Use binary messages for better performance
    receive(msg: IncrementMessage) {
        counter = counter + 1;
    }
}

message IncrementMessage {
    // Binary message is more efficient than text
}
```

**Note**: While text receivers can be useful for debugging or simple interactions, they are less efficient than binary
messages because:

- Text messages require additional processing and encoding
- Binary messages are more compact and faster to process
- Binary messages provide better type safety and validation

### Use Explicit String Receiver

**ID**: `use-explicit-string-receiver`
**Severity**: Warning
**Category**: Performance
**Auto-fix**: Available

Suggests using explicit string receivers instead of checking string parameters in a fallback string receiver. This helps
improve code clarity and performance.

**Before**:

```tact
contract Contract {
    owner: Address;

    receive(msg: String) {
        if (msg == "mint") {  // Warning: Consider using an explicit receiver
            // mint logic
        }

        if (msg == "burn") {  // Warning: Consider using an explicit receiver
            // burn logic
        }
    }
}
```

**After**:

```tact
contract Contract {
    owner: Address;

    // OK: Using explicit string receiver
    receive("mint") {
        // mint logic
    }

    // OK: Using explicit string receiver
    receive("burn") {
        // burn logic
    }
}
```

**Note**: This inspection only triggers for equality checks (`==`) with string literals in string receivers. It won't
trigger for other comparison operators or dynamic string comparisons.

### Don't Use Deployable

**ID**: `dont-use-deployable`
**Severity**: Warning
**Category**: Performance
**Auto-fix**: Available

Warns against using the deprecated `Deployable` and `FactoryDeployable` traits. Since Tact 1.6.0, these traits are
deprecated and should not be used unless you specifically need the `queryId` functionality.

Instead of using these traits, you should use an empty message body receiver for deployments.

**Before**:

```tact
import "@stdlib/deploy";

contract MyContract with Deployable {  // Warning: Prefer empty receiver with cashback over Deployable trait
    // Contract implementation
}
```

**After**:

```tact
contract MyContract {
    // Use empty message body receiver instead
    receive() {
        cashback(sender());  // Return excess gas to sender
    }
}
```

## Code Quality Inspections

### Unused Import

**ID**: `unused-import`
**Severity**: Hint
**Category**: Code Quality
**Auto-fix**: Not available

Detects imported modules that are not used in the code. This helps keep the codebase clean and reduces unnecessary
dependencies.

**Example**:

```tact
import "@stdlib/ownable";  // Warning: Import '@stdlib/ownable' is never used
import "./messages";       // OK: Used in the code

contract MyContract {
    receive(msg: SomeMessage) {}  // SomeMessage is defined in './messages'
}
```

### Unused Variable

**ID**: `unused-variable`
**Severity**: Warning
**Category**: Code Quality
**Auto-fix**: Not available

Identifies variables that are declared but never used in the code. Variables named `_` are ignored.

**Example**:

```tact
contract MyContract {
    fun foo() {
        let unused = 42;  // Warning: Variable 'unused' is never used
        let used = 24;
        send(used);       // OK: Variable is used

        let _ = someFunction();  // OK: Explicitly ignored variable
    }
}
```

**Note**: This inspection also checks destructured variables:

```tact
struct Point {
    x: Int;
    y: Int;
}

fun process(p: Point) {
    let Point { x, y: height } = p;  // Warning: Variable 'x' is never used
    dump(height);  // OK: Variable is used
}
```

### Unused Parameter

**ID**: `unused-parameter`
**Severity**: Warning
**Category**: Code Quality
**Auto-fix**: Not available

Identifies function parameters that are declared but never used in the function body.

**Example**:

```tact
contract MyContract {
    // Warning: Parameter 'unused' is never used
    fun processData(id: Int, unused: String, data: Cell) {
        dump(id);
        dump(data);
    }

    // OK: All parameters are used
    fun sum(a: Int, b: Int): Int {
        return a + b;
    }
}
```

### Struct Initialization

**ID**: `struct-initialization`
**Severity**: Error
**Category**: Code Quality
**Auto-fix**: Not available

Checks if all required fields are properly initialized when creating struct instances. Fields with default values are
optional.

**Example**:

```tact
struct Point {
    x: Int;
    y: Int;
    z: Int = 0;  // Optional field with default value
}

fun createPoints() {
    Point {};                // Error: Fields 'x', 'y' are required but not initialized
    Point { x: 1 };          // Error: Field 'y' is required but not initialized

    Point { x: 1, y: 2 };    // OK: All required fields initialized
    Point { x: 1, y: 2, z: 3 }; // OK: All fields initialized

    // Short syntax is also supported
    let x = 10;
    let y = 20;
    Point { x, y };          // OK: All required fields initialized using short syntax
}
```

### Implicit Return Value Discard

**ID**: `implicit-return-value-discard`
**Severity**: Warning
**Category**: Code Quality
**Auto-fix**: Available

Warns when a function's return value is not used. Functions that return a value should either have their result used or
explicitly discarded.

**Example**:

```tact
contract Contract {
    owner: Address;

    get fun owner(): Address {
        bar(10);            // Warning: Return value is not used
        return self.owner;
    }
}

fun bar(a: Int): Bool {
    return a == 10;
}
```

**Fixed**:

```tact
contract Contract {
    owner: Address;

    get fun owner(): Address {
        let _ = bar(10);    // OK: Return value explicitly discarded
        // or
        let result = bar(10); // OK: Return value used
        if (result) {
            // do something
        }
        return self.owner;
    }
}

fun bar(a: Int): Bool {
    return a == 10;
}
```

**Note**: This inspection doesn't trigger for void functions (functions without a return type).

### Empty Block

**ID**: `empty-block`
**Severity**: Warning
**Category**: Code Quality
**Auto-fix**: Not available

Identifies empty code blocks that might indicate incomplete implementation.

**Example**:

```tact
contract MyContract {
    fun emptyFunction() {  // Warning: Empty code block
    }

    fun implementedFunction() {  // OK: Has implementation
        dump("I do something");
    }

    // The inspection also checks control flow blocks
    fun conditionalLogic(flag: Bool) {
        if (flag) {  // Warning: Empty code block
        }

        if (!flag) {  // OK: Has implementation
            dump("Flag is false");
        }
    }
}
```

### Unused Contract Members

**ID**: `unused-contract-members`
**Severity**: Warning
**Category**: Code Quality
**Auto-fix**: Not available

Identifies contract members (fields, constants, methods) that are never used in the code. Members that override parent
trait members are not considered unused.

**Note**: The following members are not considered unused:

- Fields and methods that override parent trait members
- Get methods (methods with `get` modifier)
- Members that are used in contract initialization
- Members that are part of the contract's public interface

## Contract-specific Inspections

### Missed Field in Contract

**ID**: `missed-field-in-contract`
**Severity**: Error
**Category**: Contract Safety
**Auto-fix**: Not available

Identifies fields that are required by inherited traits but not implemented in the contract. This ensures that all
required fields from traits are properly implemented.

**Example**:

```tact
primitive Address;

trait Ownable {
    owner: Address;  // Required field
}

trait WithValue {
    value: Int;     // Required field
}

contract MyContract with Ownable, WithValue {
    // Error: Contract `MyContract` is missing `owner` field required by `Ownable`
    // Error: Contract `MyContract` is missing `value` field required by `WithValue`
}

contract ValidContract with Ownable, WithValue {  // OK: All required fields implemented
    owner: Address;  // Implements field from Ownable trait
    value: Int;      // Implements field from WithValue trait
}
```

**Note**: All fields defined in traits must be implemented in the contract. Missed fields will result in compilation
errors.

## Syntax and Compilation Inspections

### Not Imported Symbol

**ID**: `not-imported-symbol`
**Severity**: Error
**Category**: Compilation
**Auto-fix**: Available

Reports usage of symbols that haven't been imported.

**Example**:

```tact
// Missing import: import "./messages";

contract MyContract {
    receive(msg: SomeMessage) {  // Error: Symbol from another file should be imported
        // ...
    }
}
```

**Fixed**:

```tact
import "./messages";  // Added missing import

contract MyContract {
    receive(msg: SomeMessage) {  // OK: Symbol is now imported
        // ...
    }
}
```
