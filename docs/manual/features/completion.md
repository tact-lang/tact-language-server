# Completion

Language Server provides several types of completion.

## Symbols Completion

Simple type of autocompletion that offers a list of possible completions for the current context, for example,
all local variables, parameters, global functions, and so on.

https://github.com/user-attachments/assets/e81635f0-8243-489c-8df8-fd2b0cdf0de9

### Auto-import

When autocompleting a symbol that is defined in another file or in stdlib, LS will automatically add the import of the
required file:

https://github.com/user-attachments/assets/e49e7cfe-57f6-4ad7-bd9a-9798a1eea9d8

## Imports completion

When you want to import another file, LS will help you find it:

https://github.com/user-attachments/assets/eadd5103-b59d-4b41-82ad-17c982f343aa

## Postfix completion

Postfix completion allows you to avoid unnecessary backtracking. The following constructs can be created via postfix
completion:

- `expr.if ` -> `if (expr) {}`
- `expr.let` -> `let $0 = expr;`
- `expr.repeat` -> `repeat (expr) {}`
- `expr.do` -> `do {} while (expr)`
- `expr.not` -> `!expr`
- `expr.call` -> `(expr)`

https://github.com/user-attachments/assets/172340c0-c332-46f2-a438-71dc9c7f4c10

## Smart completion

LS provides autocompletion that can expand into entire constructs based on the current context,

- `return` expands to `return;` or `return $0;` depending on the context
- In functions that return `Bool`, the variants `return false;` and `return true;` are automatically added
- In functions that return `String`, the variant `return "";` is automatically added
- In functions that return `T?`, the variant `return null;` is automatically added

### Override method completion

If a contract or trait inherits from another trait that defines a method, LS will add a completion variant that will
expand into a full description:

https://github.com/user-attachments/assets/093b8c9a-7502-4a50-881f-82ee09398eae

### Implement field completion

If a contract or trait inherits from another trait that defines a certain field, LS will add an auto-completion option
that will expand into a full description:

https://github.com/user-attachments/assets/47e77029-d933-474f-a4b0-787357d319f8

### Generate getter for field

If a contract or trait has fields, then by entering their name in the body of the contract/trait,
you can generate a getter:

https://github.com/user-attachments/assets/e877d275-3602-4526-91ba-b913e32844f7

Using the `state` you can generate a getter for the entire contract state at once.

## `self.X` completion

If you are in a contract/trait or in a type method, you need to use `self` to access a field, LS will automatically
insert `self.` if needed:

https://github.com/user-attachments/assets/590eba91-53a8-4162-bd5a-6eac0f7e2d04

## Function call completion

LS knows that if a function has no arguments, it should put the caret after the arguments, and if it does, it should put
caret inside. LS will also add `;` if that's correct. If you're replacing the name of the function being called, LS
won't add extra parentheses.

https://github.com/user-attachments/assets/8ba17414-2a15-4977-a2c3-8b8e776bb406
