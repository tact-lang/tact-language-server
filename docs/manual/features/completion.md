# Completion

Language Server provides several types of completion.

## Symbols Completion

Simple type of autocompletion that offers a list of possible completions for the current context, for example,
all local variables, parameters, global functions, and so on.

<video src="../assets/completion.mov"></video>

### Auto-import

When autocompleting a symbol that is defined in another file or in stdlib, LS will automatically add the import of the
required file:

<video src="../assets/auto-import.mov"></video>

## Imports completion

When you want to import another file, LS will help you find it:

<video src="../assets/import-completion.mov"></video>

## Postfix completion

Postfix completion allows you to avoid unnecessary backtracking. The following constructs can be created via postfix
completion:

- `expr.if ` -> `if (expr) {}`
- `expr.let` -> `let $0 = expr;`
- `expr.repeat` -> `repeat (expr) {}`
- `expr.do` -> `do {} while (expr)`
- `expr.not` -> `!expr`
- `expr.call` -> `(expr)`

<video src="../assets/postfix-completion.mov"></video>

## Smart completion

LS provides autocompletion that can expand into entire constructs based on the current context,

- `return` expands to `return;` or `return $0;` depending on the context
- In functions that return `Bool`, the variants `return false;` and `return true;` are automatically added
- In functions that return `String`, the variant `return "";` is automatically added
- In functions that return `T?`, the variant `return null;` is automatically added

### Override method completion

If a contract or trait inherits from another trait that defines a method, LS will add a completion variant that will
expand into a full description:

<video src="../assets/override-completion.mov"></video>

### Implement field completion

If a contract or trait inherits from another trait that defines a certain field, LS will add an auto-completion option
that will expand into a full description:

<video src="../assets/field-completion.mov"></video>

## `self.X` completion

If you are in a contract/trait or in a type method, you need to use `self` to access a field, LS will automatically
insert `self.` if needed:

<video src="../assets/self-completion.mov"></video>

## Function call completion

LS knows that if a function has no arguments, it should put the caret after the arguments, and if it does, it should put
caret inside. LS will also add `;` if that's correct. If you're replacing the name of the function being called, LS
won't add extra parentheses.

<video src="../assets/call-completion.mov"></video>
