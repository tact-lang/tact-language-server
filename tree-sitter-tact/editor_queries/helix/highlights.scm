; See: https://docs.helix-editor.com/master/themes.html#syntax-highlighting
; -------------------------------------------------------------------------

; variable
; --------

(identifier) @variable

; variable.builtin
; ----------------

(self) @variable.builtin

; variable.parameter
; ------------------

(parameter
  name: (identifier) @variable.parameter)

; variable.other.member
; ---------------------

(storage_variable
  name: (identifier) @variable.other.member)

(field
  name: (identifier) @variable.other.member)

(field_access_expression
  name: (identifier) @variable.other.member)

(instance_argument
  name: (identifier) @variable.other.member)

; punctuation.delimiter
; ---------------------

[
  ";"
  ","
  "."
  ":"
  "?"
] @punctuation.delimiter

; punctuation.bracket
; -------------------

[
  "(" ")"
  "{" "}"
] @punctuation.bracket

; operator
; --------

[
  "-" "-="
  "+" "+="
  "*" "*="
  "/" "/="
  "%" "%="
  "=" "=="
  "!" "!=" "!!"
  "<" "<=" "<<"
  ">" ">=" ">>"
  "&" "|" "^"
  "&&" "||"
  "->"
] @operator

; constructor
; -----------

(instance_expression
  name: (identifier) @constructor)

(initOf
  name: (identifier) @constructor)

; type
; ----

(type_identifier) @type

; type.builtin
; ------------

(tlb_serialization
  "as" @keyword
  type: (identifier) @type.builtin
  (#match? @type.builtin
    "^(coins|remaining|bytes32|bytes64|int257|u?int(?:2[0-5][0-6]|1[0-9][0-9]|[1-9][0-9]?))$"))

((type_identifier) @type.builtin
  (#any-of? @type.builtin
    "Address" "Bool" "Builder" "Cell" "Int" "Slice" "String" "StringBuilder"))

(map_type
  "map" @type.builtin
  "<" @punctuation.bracket
  ">" @punctuation.bracket)

(bounced_type
  "bounced" @type.builtin
  "<" @punctuation.bracket
  ">" @punctuation.bracket)

((identifier) @type.builtin
  (#any-of? @type.builtin "Context" "SendParameters" "StateInit" "StdAddress" "VarAddress")
  (#is-not? local))

; string
; ------

(string) @string

; string.special.path
; -------------------

(import
  library: (string) @string.special.path)

; constant
; --------

(global_constant
  name: (identifier) @constant)

(storage_constant
  name: (identifier) @constant)

; constant.character.escape
; -------------------------

(escape_sequence) @constant.character.escape

; constant.numeric.integer
; ------------------------

(integer) @constant.numeric.integer

; constant.builtin
; ----------------

((identifier) @constant.builtin
  (#any-of? @constant.builtin
    "SendBounceIfActionFail"
    "SendPayGasSeparately"
    "SendIgnoreErrors"
    "SendDestroyIfZero"
    "SendRemainingValue"
    "SendRemainingBalance"
    "SendOnlyEstimateFee"
    "ReserveExact"
    "ReserveAllExcept"
    "ReserveAtMost"
    "ReserveAddOriginalBalance"
    "ReserveInvertSign"
    "ReserveBounceIfActionFail")
  (#is-not? local))

(null) @constant.builtin

; constant.builtin.boolean
; ------------------------

(boolean) @constant.builtin.boolean

; keyword
; -------

[
  "with"
  ; "public" ; -- not used, but declared in grammar.ohm
  ; "extend" ; -- not used, but declared in grammar.ohm
] @keyword

; keyword.storage.modifier
; ------------------------

[
  "get" "mutates" "extends" "virtual" "override" "inline" "abstract"
] @keyword.storage.modifier

; keyword.storage.type
; --------------------

[
  "contract" "trait" "struct" "message" "with"
  "const" "let"
] @keyword.storage.type

; keyword.function
; ----------------

[
  "fun"
  "native"
  "asm"
] @keyword.function

; keyword.directive
; -----------------

"primitive" @keyword.directive

; keyword.operator
; ----------------

"initOf" @keyword.operator

; keyword.control.exception
; -------------------------

[
  "try" "catch"
] @keyword.control.exception

; keyword.control.return
; ----------------------

"return" @keyword.control.return

; keyword.control.import
; ----------------------

"import" @keyword.control.import

; keyword.control.repeat
; ----------------------


(foreach_statement
  . (_)
  . (_)
  . "in" @keyword.control.repeat)

[
  "while" "repeat" "do" "until" "foreach"
] @keyword.control.repeat

; keyword.control.conditional
; ---------------------------

[
  "if" "else"
] @keyword.control.conditional

; function
; --------

(func_identifier) @function

(native_function
  name: (identifier) @function)

(asm_function
  name: (identifier) @function)

(global_function
  name: (identifier) @function)

(static_call_expression
  name: (identifier) @function)

(init_function
  "init" @function.method)

(receive_function
  "receive" @function.method)

(bounced_function
  "bounced" @function.method)

(external_function
  "external" @function.method)

(storage_function
  name: (identifier) @function.method)

; function.method
; ---------------

(method_call_expression
  name: (identifier) @function.method)

; attribute
; ---------

[
  "@name"
  "@interface"
] @attribute

; comment.block
; -------------

(comment) @comment.block

; comment.line
; ------------

((comment) @comment.line
  (#match? @comment.line "^//"))
