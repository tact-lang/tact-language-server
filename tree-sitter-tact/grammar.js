/// Two following lines are used to enable type-checking:
/// <reference types="tree-sitter-cli/dsl" />
/// @ts-check

/**
 * @file Tact grammar for tree-sitter
 * @author Novus Nota (https://github.com/novusnota)
 * @license MIT
 */

/**
 * Creates a rule to match one or more of the rules separated by a semicolon with an optional trailing semicolon
 *
 * @param {Rule} rule
 *
 * @return {ChoiceRule}
 *
 */
function semicolonSepWithTrailing(rule) {
  return optional(seq(rule, repeat(seq(";", rule)), optional(";")));
}

/**
 * Creates a rule to match one or more of the rules separated by a comma with an optional trailing comma
 *
 * @param {Rule} rule
 *
 * @return {ChoiceRule}
 *
 */
function commaSepWithTrailing(rule) {
  return optional(seq(rule, repeat(seq(",", rule)), optional(",")));
}

/**
 * Creates a rule to match one or more of the rules separated by a comma with an optional trailing comma or a trailing comma and a .. ("the rest", remaining fields)
 *
 * @param {Rule} rule
 *
 * @return {ChoiceRule}
 *
 */
function commaSepWithTrailingRest(rule) {
  return optional(
    seq(rule, repeat(seq(",", rule)), optional(seq(",", optional("..")))),
  );
}

/**
 * Creates a rule to match one or more of the rules separated by a comma
 *
 * @param {Rule} rule
 *
 * @return {SeqRule}
 *
 */
function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)));
}

/**
 * Creates a rule to optionally match one or more of the rules separated by a comma
 *
 * @param {Rule} rule
 *
 * @return {ChoiceRule}
 *
 */
function commaSep(rule) {
  return optional(commaSep1(rule));
}

/**
 * Tact grammar, refined and adapted from [grammar.ohm](https://github.com/tact-lang/tact/blob/main/src/grammar/grammar.ohm)
 */
module.exports = grammar({
  name: "tact",

  /* The name of a token that will match keywords for their extraction optimization */
  word: ($) => $.identifier,

  /* An array of tokens that may appear anywhere in the language */
  extras: ($) => [/\s/, $.comment],

  // reserved: ($) => [],
  // see: https://github.com/tree-sitter/tree-sitter/pull/1635

  /* A list of hidden rule names */
  supertypes: ($) => [$.value_expression],

  /* Each inner array represents a descending ordering of precedence */
  precedences: (_) => [
    [
      "non_null_assert_expr",
      "method_call_expr",
      "field_access_expr",
      "static_call_expr",
      "parenthesized_expr",
      "instance_expr",
      "map_literal",

      // "unary_suffix_expr",
      "unary_expr",

      "binary_multiplication",

      "binary_addition",

      "bitwise_shift",

      "binary_relation",

      "binary_equality",

      "bitwise_and",
      "bitwise_xor",
      "bitwise_or",

      "logical_and",
      "logical_or",

      "ternary_expr",

      "assign_stmt",
    ],
  ],

  /* Each inner array represents a set of rules that's involved in an LR(1) conflict
 that is intended to exist in the grammar and be resolved by Tree-sitter at runtime using GLR algorithm */
  conflicts: ($) => [[$.constant_attributes, $.function_attributes]],

  /* Mapping of grammar rule names to rule builder functions */
  rules: {
    source_file: ($) => seq(repeat($.import), repeat($._module_item)),

    /* Imports */

    import: ($) => seq("import", field("library", $.string), optional(";")),

    /* Module items */

    _module_item: ($) =>
      choice(
        $.primitive,
        alias($._constant, $.global_constant),
        $.native_function,
        $.asm_function,
        alias($._function, $.global_function),
        $.struct,
        $.message,
        $.contract,
        $.trait,
      ),

    /* Built-in declarations */

    primitive: ($) =>
      seq(
        "primitive",
        field("type", alias($._type_identifier, $.type_identifier)),
        ";",
      ),

    /* Constants */

    _constant: ($) =>
      seq(
        field("attributes", optional($.constant_attributes)),
        "const",
        field("name", $.identifier),
        ":",
        field("type", $._type),
        optional(seq("=", field("value", $._expression))),
        ";",
      ),

    constant_attributes: (_) =>
      repeat1(choice("virtual", "override", "abstract")),

    /* Native functions */

    native_function: ($) =>
      seq(
        field("name_attribute", optional($.name_attribute)),
        field("attributes", optional($.function_attributes)),
        "native",
        field("name", $.identifier),
        field("parameters", $.parameter_list),
        optional(seq(":", field("result", $._type))),
        ";",
      ),

    name_attribute: ($) =>
      seq("@name", "(", field("func_name", $.func_identifier), ")"),

    /* Asm functions */

    asm_function: ($) =>
      seq(
        "asm",
        field("arrangement", optional($.asm_arrangement)),
        field("attributes", optional($.function_attributes)),
        "fun",
        field("name", $.identifier),
        field("parameters", $.parameter_list),
        field("result", optional(seq(":", $._type))),
        field("body", $.asm_function_body),
      ),

    asm_arrangement: ($) =>
      seq(
        "(",
        field("arguments", optional($.asm_arrangement_args)),
        field("returns", optional($.asm_arrangement_rets)),
        ")",
      ),

    asm_arrangement_args: ($) => repeat1($.identifier),
    asm_arrangement_rets: ($) =>
      seq("->", repeat1(alias($._decimal_integer, $.integer))),

    // NOTE:
    // The following asm-related pieces intentionally differ from the grammar.gg.
    // This is done to provide a better API for the language server.
    //
    // There's no catch because there's no well-defined Tact assembly syntax
    // that we've agreed upon — the current parser in the compiler
    // simply produces a large string to be passed as-is to the rest of the pipeline.
    //
    // Therefore, most of the things below would be internally refactored and/or removed completely once there's a proper definition of the Tact assembly.
    // (That does NOT require Fift removal, a first step might be just
    //  converting our syntax to bits of the Fift syntax seen below)
    //
    asm_function_body: ($) => seq("{", repeat($.asm_expression), "}"),

    // Zero or more arguments, followed by a TVM instruction
    asm_expression: ($) =>
      prec.right(
        seq(
          field("arguments", optional($.asm_argument_list)),
          field("name", $.tvm_instruction),
        ),
      ),

    // One or more primitives
    asm_argument_list: ($) => repeat1($._asm_primitive),

    // See comments for each
    _asm_primitive: ($) =>
      choice(
        $.asm_sequence,
        $.asm_string,
        $.asm_hex_bitstring,
        $.asm_bin_bitstring,
        $.asm_boc_hex,
        $.asm_control_register,
        $.asm_stack_register,
        $.asm_integer,
      ),

    // <{ ... }>
    asm_sequence: ($) =>
      seq("<{", repeat($.asm_expression), choice("}>c", "}>s", "}>CONT", "}>")),

    // "..."
    asm_string: (_) =>
      seq(
        choice('abort"', '."', '+"', '"'),
        token.immediate(prec(1, /[^"]*/)),
        token.immediate('"'),
      ),

    // x{DEADBEEF_}
    // x{babecafe}
    // x{}
    asm_hex_bitstring: (_) => /x\{[a-fA-F0-9]*_?\}/,

    // b{011101010}
    // b{}
    asm_bin_bitstring: (_) => /b\{[01]*\}/,

    // B{DEADBEEF_} B>boc
    // B{babecafe} B>boc
    // B{} B>boc
    // <b b>
    asm_boc_hex: (_) => choice(/B\{[a-fA-F0-9]*_?\}\s+B>boc/, /<b\s+b>/),

    // c0
    // c15
    asm_control_register: (_) => /c\d\d?/,

    // s0
    // s15
    // 16 s()
    asm_stack_register: (_) => choice(/s\d\d?/, /\d\d?\d?\s+s\(\)/),

    // 0
    // 500
    // -42
    // 0b10
    // 0xff
    // 0xFF
    asm_integer: (_) => {
      const hex_literal = /-?0x[a-fA-F0-9]+/;
      const bin_literal = /-?0b[01]+/;
      const dec_literal = /-?\d+/;

      return token(
        choice(
          hex_literal, // hexadecimal
          bin_literal, // binary
          dec_literal, // decimal
        ),
      );
    },

    // MYCODE
    // HASHEXT_SHA256
    // ADDRSHIFTMOD ADDRSHIFT#MOD
    // IF IF:
    // XCHG3 XCHG3_l
    // 2SWAP SWAP2
    // ROT -ROT
    tvm_instruction: (_) => /-?[A-Z0-9_#:]+l?/,

    /* Functions */

    _function: ($) =>
      seq(
        field("attributes", optional($.function_attributes)),
        "fun",
        field("name", $.identifier),
        field("parameters", $.parameter_list),
        field("result", optional(seq(":", $._type))),
        choice(";", field("body", alias($.block_statement, $.function_body))),
      ),

    _function_declaration: ($) =>
      seq(
        field("attributes", optional($.function_attributes)),
        "fun",
        field("name", $.identifier),
        field("parameters", $.parameter_list),
        field("result", optional(seq(":", $._type))),
      ),

    _function_definition: ($) =>
      seq(
        field("attributes", optional($.function_attributes)),
        "fun",
        field("name", $.identifier),
        field("parameters", $.parameter_list),
        field("result", optional(seq(":", $._type))),
        field("body", alias($.block_statement, $.function_body)),
      ),

    function_attributes: ($) =>
      repeat1(
        choice(
          $.get_attribute,
          "mutates",
          "extends",
          "virtual",
          "override",
          "inline",
          "abstract",
        ),
      ),

    get_attribute: ($) =>
      seq("get", optional(seq("(", field("value", $._expression), ")"))),

    parameter_list: ($) => seq("(", commaSepWithTrailing($.parameter), ")"),

    parameter: ($) =>
      seq(
        field("name", $.identifier),
        ":",
        field("type", $._type),
        field("_completion_anchor", optional($.identifier)),
        field("tlb", optional($.tlb_serialization)),
      ),

    /* Structs, Messages */

    struct: ($) =>
      seq(
        "struct",
        field("name", alias($._type_identifier, $.type_identifier)),
        field("body", $.struct_body),
      ),

    message: ($) =>
      seq(
        "message",
        field("value", optional($.message_value)),
        field("name", alias($._type_identifier, $.type_identifier)),
        field("body", alias($.struct_body, $.message_body)),
      ),

    message_value: ($) => seq("(", $._expression, ")"),

    struct_body: ($) => seq("{", repeat($.field), "}"),

    /* Fields (of messages, structs, contracts, traits) */

    field: ($) =>
      seq(field("name", $.identifier), $._field_after_id, optional(";")),

    // Like _constant, but without a semicolon at the end
    storage_constant: ($) =>
      seq(
        field("attributes", optional($.constant_attributes)),
        "const",
        field("name", $.identifier),
        ":",
        field("type", $._type),
        optional(seq("=", field("value", $._expression))),
      ),

    storage_variable: ($) =>
      seq(field("name", $.identifier), $._field_after_id),

    _field_after_id: ($) =>
      prec.left(
        seq(
          ":",
          field("type", $._type),
          field("_completion_anchor", optional($.identifier)),
          field("tlb", optional($.tlb_serialization)),
          optional(seq("=", field("value", $._expression))),
        ),
      ),

    /* Contracts, Traits */

    contract: ($) =>
      seq(
        field("attributes", optional($.contract_attributes)),
        "contract",
        field("name", $.identifier),
        optional(field("parameters", $.parameter_list)),
        field("traits", optional($.trait_list)),
        field("body", $.contract_body),
      ),

    trait: ($) =>
      seq(
        field(
          "attributes",
          optional(alias($.contract_attributes, $.trait_attributes)),
        ),
        "trait",
        field("name", $.identifier),
        field("traits", optional($.trait_list)),
        field("body", $.trait_body),
      ),

    contract_attributes: ($) => repeat1(seq("@interface", "(", $.string, ")")),

    trait_list: ($) =>
      seq(
        "with",
        commaSepWithTrailing(alias($._type_identifier, $.type_identifier)),
      ),

    contract_body: ($) =>
      seq(
        "{",
        repeat(
          choice(
            seq($.storage_constant, optional(";")),
            seq($.storage_variable, optional(";")),
            $.init_function,
            $._receiver_function,
            alias($._function, $.storage_function),
          ),
        ),
        "}",
      ),

    trait_body: ($) =>
      seq(
        "{",
        repeat(
          choice(
            seq($.storage_constant, optional(";")),
            seq($.storage_variable, optional(";")),
            $._receiver_function,
            alias($._function, $.storage_function),
          ),
        ),
        "}",
      ),

    init_function: ($) =>
      seq(
        "init",
        field("parameters", $.parameter_list),
        field("body", alias($.block_statement, $.function_body)),
      ),

    _receiver_function: ($) =>
      choice($.receive_function, $.bounced_function, $.external_function),

    receive_function: ($) =>
      seq(
        "receive",
        "(",
        field("parameter", optional(choice($.string, $.parameter))),
        ")",
        field("body", alias($.block_statement, $.function_body)),
      ),

    bounced_function: ($) =>
      seq(
        "bounced",
        "(",
        field("parameter", $.parameter),
        ")",
        field("body", alias($.block_statement, $.function_body)),
      ),

    external_function: ($) =>
      seq(
        "external",
        "(",
        field("parameter", optional(choice($.string, $.parameter))),
        ")",
        field("body", alias($.block_statement, $.function_body)),
      ),

    /* Statements*/

    _statement: ($) =>
      choice($._statement_with_brace, seq($._statement_without_semicolon, ";")),

    _statement_with_brace: ($) =>
      choice(
        $.block_statement, // StatementBlock
        $.if_statement, // StatementCondition
        $.while_statement, // StatementWhile
        $.repeat_statement, // StatementRepeat
        $.try_statement, // StatementTry
        $.foreach_statement, // StatementForEach
      ),

    _statement_without_semicolon: ($) =>
      choice(
        $.let_statement, // StatementLet
        $.return_statement, // StatementReturn
        $.expression_statement, // StatementExpression
        $.assignment_statement, // StatementAssign
        $.augmented_assignment_statement, // StatementAugmentedAssign
        $.do_until_statement, // StatementUntil
        $.destruct_statement, // StatementDestruct
      ),

    let_statement: ($) =>
      seq(
        "let",
        field(
          "name",
          choice($.identifier, alias($._type_identifier, $.identifier)),
        ),
        optional(
          seq(
            optional(seq(":", field("type", $._type))),
            "=",
            field("value", $._expression),
          ),
        ),
      ),

    destruct_statement: ($) =>
      seq(
        "let",
        field("name", alias($._type_identifier, $.type_identifier)),
        field("binds", $.destruct_bind_list),
        "=",
        field("value", $._expression),
      ),

    destruct_bind_list: ($) =>
      seq("{", commaSepWithTrailingRest($.destruct_bind), "}"),

    destruct_bind: ($) =>
      seq(
        field("name", $.identifier),
        optional(seq(":", field("bind", $.identifier))),
      ),

    block_statement: ($) =>
      prec.right(
        seq(
          "{",
          repeat($._statement),
          optional($._statement_without_semicolon),
          "}",
        ),
      ),

    return_statement: ($) => seq("return", optional($._expression)),

    expression_statement: ($) => seq($._expression),

    assignment_statement: ($) =>
      prec.right(
        "assign_stmt",
        seq(
          field("left", $._path_expression),
          "=",
          field("right", $._expression),
        ),
      ),

    augmented_assignment_statement: ($) =>
      prec.right(
        "assign_stmt",
        seq(
          field("left", $._path_expression),
          field(
            "operator",
            choice(
              "+=",
              "-=",
              "*=",
              "/=",
              "%=",
              "&=",
              "|=",
              "^=",
              "||=",
              "&&=",
              ">>=",
              "<<=",
            ),
          ),
          field("right", $._expression),
        ),
      ),

    if_statement: ($) =>
      seq(
        "if",
        "(",
        field("condition", $._expression),
        ")",
        field("consequence", $.block_statement),
        field("alternative", optional($.else_clause)),
      ),

    else_clause: ($) => seq("else", choice($.block_statement, $.if_statement)),

    while_statement: ($) =>
      seq(
        "while",
        "(",
        field("condition", $._expression),
        ")",
        field("body", $.block_statement),
      ),

    repeat_statement: ($) =>
      seq(
        "repeat",
        "(",
        field("condition", $._expression),
        ")",
        field("body", $.block_statement),
      ),

    do_until_statement: ($) =>
      seq(
        "do",
        field("body", $.block_statement),
        "until",
        "(",
        field("condition", $._expression),
        ")",
      ),

    try_statement: ($) =>
      seq(
        "try",
        field("body", $.block_statement),
        field("handler", optional($.catch_clause)),
      ),

    catch_clause: ($) =>
      seq(
        "catch",
        "(",
        field("name", $.identifier),
        ")",
        field("body", $.block_statement),
      ),

    foreach_statement: ($) =>
      seq(
        "foreach",
        "(",
        field("key", $.identifier),
        ",",
        field("value", $.identifier),
        "in",
        field("map", $._expression),
        ")",
        field("body", $.block_statement),
      ),

    _path_expression: ($) =>
      choice($.self, $.identifier, $.field_access_expression),

    /* Expressions */

    _expression: ($) =>
      choice(
        $.ternary_expression, // ExpressionConditional
        $.binary_expression, // ExpressionBinary
        $.unary_expression, // ExpressionUnary
        // $.unary_suffix_expression, // ExpressionUnarySuffix
        $.value_expression, // ExpressionValue
      ),

    ternary_expression: ($) =>
      prec.right(
        "ternary_expr",
        seq(
          field("condition", $._expression),
          "?",
          field("consequence", $._expression),
          ":",
          field("alternative", $._expression),
        ),
      ),

    binary_expression: ($) =>
      choice(
        ...[
          ["||", "logical_or"], // ExpressionOr
          ["&&", "logical_and"], // ExpressionAnd

          ["|", "bitwise_or"], // ExpressionBinaryOr
          ["^", "bitwise_xor"], // ExpressionBinaryXor
          ["&", "bitwise_and"], // ExpressionBinaryAnd

          ["!=", "binary_equality"], // ExpressionEquality
          ["==", "binary_equality"], // ExpressionEquality

          [">", "binary_relation"], // ExpressionCompare
          [">=", "binary_relation"], // ExpressionCompare
          ["<", "binary_relation"], // ExpressionCompare
          ["<=", "binary_relation"], // ExpressionCompare

          [">>", "bitwise_shift"], // ExpressionBinaryShift
          ["<<", "bitwise_shift"], // ExpressionBinaryShift

          ["+", "binary_addition"], // ExpressionAdd
          ["-", "binary_addition"], // ExpressionAdd

          ["*", "binary_multiplication"], // ExpressionMul
          ["/", "binary_multiplication"], // ExpressionMul
          ["%", "binary_multiplication"], // ExpressionMul
        ].map(([operator, precedence]) =>
          prec.left(
            precedence,
            seq(
              field("left", $._expression),
              field(
                "operator",
                operator,
                // alias(operator, {
                //   '||': $.logical_or,
                //   '&&': $.logical_and,
                //   '!=': $.binary_comparison_ineq,
                //   '==': $.binary_comparison,
                //   '>' : $.binary_relation_gt,
                //   '>=': $.binary_relation_ge,
                //   '<' : $.binary_relation_lt,
                //   '<=': $.binary_relation_le,
                //   '>>': $.bitwise_expression_sright,
                //   '<<': $.bitwise_expression_sleft,
                //   '&' : $.bitwise_expression_and,
                //   '|' : $.bitwise_expression_or,
                //   '+' : $.binary_addition_plus,
                //   '-' : $.binary_addition_minus,
                //   '*' : $.binary_multiplication_times,
                //   '/' : $.binary_multiplication_divide,
                //   '%' : $.binary_multiplication_modulo,
                // }[operator])
              ),
              field("right", $._expression),
            ),
          ),
        ),
      ),

    unary_expression: ($) =>
      prec.left(
        "unary_expr",
        seq(
          field(
            "operator",
            choice(
              "-",
              "+",
              "!",
              "~",
              // alias('-', $.minus_op), alias('+', $.plus_op), alias('!', $.not_op)
            ),
          ),
          field("argument", $._expression),
        ),
      ),

    // unary_suffix_expression: ($) =>
    //   prec.left(
    //     "unary_suffix_expr",
    //     seq(field("argument", $._expression), field("operator", choice("!!"))),
    //   ),

    value_expression: ($) =>
      choice(
        $.non_null_assert_expression, // ExpressionUnboxNonNull
        $.method_call_expression, // ExpressionMethodCall
        $.field_access_expression, // ExpressionFieldAccess
        $.static_call_expression, // ExpressionStaticCall
        $.parenthesized_expression, // ExpressionParens
        $.map, // MapLiteral
        $.set, // SetLiteral
        $.instance_expression, // ExpressionStructInstance
        $.integer, // integerLiteral
        $.boolean, // boolLiteral
        $.identifier, // id
        $.null, // null
        $.initOf, // ExpressionInitOf
        $.codeOf, // ExpressionCodeOf
        $.string, // stringLiteral
        $.self, // self
      ),

    non_null_assert_expression: ($) =>
      prec.left(
        "non_null_assert_expr",
        seq(field("argument", $._expression), field("operator", "!!")),
      ),

    method_call_expression: ($) =>
      prec.right(
        "method_call_expr",
        seq(
          field("object", $.value_expression),
          ".",
          field("name", $.identifier),
          field("arguments", $.argument_list),
        ),
      ),

    field_access_expression: ($) =>
      prec.right(
        "field_access_expr",
        seq(
          field("object", $.value_expression),
          ".",
          field("name", $.identifier),
        ),
      ),

    static_call_expression: ($) =>
      prec.right(
        "static_call_expr",
        seq(field("name", $.identifier), field("arguments", $.argument_list)),
      ),

    argument_list: ($) => seq("(", commaSepWithTrailing($.argument), ")"),

    argument: ($) => field("value", $._expression),

    parenthesized_expression: ($) =>
      prec("parenthesized_expr", seq("(", $._expression, ")")),

    instance_expression: ($) =>
      prec.right(
        "instance_expr",
        seq(
          field("name", $.identifier),
          field("arguments", $.instance_argument_list),
        ),
      ),

    instance_argument_list: ($) =>
      seq("{", commaSepWithTrailing($.instance_argument), "}"),

    instance_argument: ($) =>
      seq(
        field("name", $.identifier),
        optional(seq(":", optional(field("value", $._expression)))),
      ),

    initOf: ($) =>
      seq(
        "initOf",
        field("name", alias($._type_identifier, $.type_identifier)),
        optional(field("arguments", $.argument_list)),
      ),

    codeOf: ($) =>
      seq(
        "codeOf",
        field("name", alias($._type_identifier, $.type_identifier)),
      ),

    map: ($) =>
      prec.right(
        "map_literal",
        seq(field("type", $.map_type), field("body", $.map_body)),
      ),

    map_body: ($) => seq("{", commaSepWithTrailing($.map_field), "}"),

    map_field: ($) =>
      seq(field("key", $._expression), ":", field("value", $._expression)),

    set: ($) =>
      prec.right(
        "map_literal",
        seq(field("type", $.set_type), field("body", $.set_body)),
      ),

    set_body: ($) => seq("{", commaSepWithTrailing($._expression), "}"),

    /* Types */

    _type: ($) => choice($.map_type, $.bounced_type, $._simple_type),

    map_type: ($) =>
      seq(
        "map",
        "<",
        optional(
          seq(
            field("key", alias($._type_identifier, $.type_identifier)),
            field("tlb_key", optional($.tlb_serialization)),
            ",",
            field("value", alias($._type_identifier, $.type_identifier)),
            field("tlb_value", optional($.tlb_serialization)),
          ),
        ),
        ">",
      ),

    set_type: ($) =>
      seq(
        "set",
        "<",
        field("type", optional($._type)),
        field("tlb", optional($.tlb_serialization)),
        optional(","),
        ">",
      ),

    bounced_type: ($) =>
      seq(
        "bounced",
        "<",
        field("message", alias($._type_identifier, $.type_identifier)),
        ">",
      ),

    _simple_type: ($) =>
      seq(alias($._type_identifier, $.type_identifier), optional("?")),

    _type_identifier: (_) => /[A-Z][a-zA-Z0-9_]*/,

    /* Serialization to TL-B types */

    tlb_serialization: ($) => seq("as", field("type", $.identifier)),

    /* Identifiers */

    func_identifier: ($) => choice($._func_plain_id, $._func_quoted_id),
    _func_quoted_id: (_) => /[.~]?`[^\n`]+`/,
    _func_plain_id: (_) => /[.~]?[^\s()\[\],.;~]+/,

    identifier: (_) => /[a-zA-Z_][a-zA-Z0-9_]*/,

    self: (_) => "self",

    /* Literals */

    string: ($) =>
      seq(
        '"',
        repeat(choice($._non_quote_or_backslash_char, $.escape_sequence)),
        token.immediate('"'),
      ),

    _non_quote_or_backslash_char: () => token.immediate(prec(1, /[^"\n\\]+/)),

    escape_sequence: () =>
      token.immediate(
        seq(
          "\\",
          choice(
            /[\\"nrtvbf]/, // \\ \" \n \r \t \v \b \f
            /x[0-9a-fA-F]{2}/, // hexEscape, \x00 through \xFF
            /u[0-9a-fA-F]{4}/, // unicodeEscape, \u0000 through \uFFFF
            /u\{[0-9a-fA-F]{1,6}\}/, // unicodeCodePoint, \u{0} through \u{FFFFFF}
          ),
        ),
      ),

    boolean: (_) => choice("true", "false"),

    null: (_) => "null",

    integer: (_) => {
      const hex_literal = seq(
        choice("0x", "0X"),
        /[\da-fA-F](?:_?[\da-fA-F])*/,
      );

      const oct_literal = seq(choice("0o", "0O"), /[0-7](?:_?[0-7])*/);

      const bin_literal = seq(choice("0b", "0B"), /[0-1](?:_?[0-1])*/);

      const dec_digits = /(?:_?\d)*/;
      const dec_literal = seq(/[1-9]/, optional(dec_digits));

      const dec_leading_zero_literal = seq(/\d/, optional(dec_digits));

      return token(
        choice(
          hex_literal, // hexadecimal
          oct_literal, // octal
          bin_literal, // binary
          dec_literal, // decimal
          dec_leading_zero_literal, // decimal, starting with 0
        ),
      );
    },

    // Used in arrangements of arguments to return values in asm functions
    _decimal_integer: (_) => {
      const dec_digits = /(?:_?\d)*/;
      const dec_literal = seq(/[1-9]/, optional(dec_digits));
      const dec_leading_zero_literal = seq(/\d/, optional(dec_digits));

      return token(choice(dec_literal, dec_leading_zero_literal));
    },

    /* Comments */

    comment: (_) =>
      token(
        choice(seq("//", /[^\n]*/), seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")),
      ),
  },
});
