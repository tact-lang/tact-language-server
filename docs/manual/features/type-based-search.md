# Type-Based Search

The Type-Based Search feature allows you to find functions by their type signatures, similar to tools available in functional programming languages like OCaml and Haskell. This is particularly useful when you know what type transformation you need but don't remember the exact function name.

## How to Use

### Keyboard Shortcut

Press `Alt+F` while editing a Tact file to open the type search dialog.

### Command Palette

1. Open the Command Palette (`Cmd+Shift+P` on macOS, `Ctrl+Shift+P` on Windows/Linux)
2. Type "Search by Type Signature" and select the command

## Query Syntax

Type signatures follow the pattern: `parameter_types -> return_type`

### Basic Examples

- `Int -> String` - Find functions that take an Int and return a String
- `String -> Int` - Find functions that take a String and return an Int
- `-> Bool` - Find functions with no parameters that return a Bool
- `Address -> Int` - Find functions that take an Address and return an Int

### Multiple Parameters

Use commas to separate multiple parameters:

- `Int, String -> Bool` - Functions taking Int and String, returning Bool
- `Address, Int, String -> Cell` - Functions with three parameters

### Wildcards

Use `_` as a wildcard to match any type:

- `_ -> Address` - Any function returning an Address (regardless of parameters)
- `Int -> _` - Functions taking an Int and returning anything
- `_, _ -> String` - Functions with two parameters returning a String
- `_ -> _` - Any function (matches all functions)

### Optional Types

Add `?` after a type name to indicate optional types:

- `Int? -> String` - Functions taking optional Int and returning String
- `String -> Int?` - Functions taking String and returning optional Int

## Search Results

The search results show:

- **Function Name** - The name of the matching function
- **Signature** - The complete function signature
- **Location** - Where the function is defined (contract, trait, or standalone)
- **Kind** - Whether it's a function, method, getter, or constructor

Click on any result to navigate directly to the function definition.

## Search Scope

The search scope can be configured in VS Code settings:

- **Workspace** (default) - Search only in your project files
- **Everywhere** - Include standard library and external dependencies

To change the scope:

1. Open VS Code Settings (`Cmd+,` on macOS, `Ctrl+,` on Windows/Linux)
2. Search for "tact.findUsages.scope"
3. Choose between "workspace" and "everywhere"

## Use Cases

### Finding Conversion Functions

```tact
// Search: "Int -> String"
// Finds: toString, formatNumber, etc.
```

### Finding Validation Functions

```tact
// Search: "String -> Bool"
// Finds: isValid, isEmpty, hasPrefix, etc.
```

### Finding Factory Functions

```tact
// Search: "-> Address"
// Finds: createAddress, getDefaultAddress, etc.
```

### Finding Processing Functions

```tact
// Search: "Cell -> Cell"
// Finds: processCell, transformCell, etc.
```

## Limitations

- Only searches for function-like entities (functions, methods, getters)
- Does not search inside function bodies or local variables
- Generic type parameters are not fully supported yet
- Complex nested types may not match perfectly

## Examples

Given these function definitions:

```tact
fun add(a: Int, b: Int): Int {
    return a + b
}

fun toString(value: Int): String {
    return value.toString()
}

fun getBalance(): Int {
    return 1000
}

contract MyContract {
    balance: Int

    get fun getBalance(): Int {
        return self.balance
    }

    fun updateBalance(newBalance: Int) {
        self.balance = newBalance
    }

    fun formatBalance(): String {
        return self.balance.toString()
    }
}
```

Search queries would find:

- `Int -> String` → `toString`, `formatBalance`
- `Int, Int -> Int` → `add`
- `-> Int` → `getBalance` (both standalone and getter)
- `Int -> _` → `updateBalance`, `toString`, `formatBalance`
- `_ -> Int` → `getBalance` functions

This feature significantly improves code discoverability and helps you find the right functions when you know the type transformation you need.
