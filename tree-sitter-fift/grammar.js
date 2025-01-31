module.exports = grammar({
  name: "fift",

  extras: ($) => [/\s/, $.comment],

  rules: {
    source_file: ($) => seq(optional($.include_directive), $.program),

    include_directive: ($) => seq('"', /[^"]+/, '"', "include"),

    comment: (_) => token(seq("//", /[^\n]*/)),

    program: ($) =>
      seq("PROGRAM{", repeat($.declaration), repeat($.definition), "END>c"),

    declaration: ($) =>
      choice(
        seq(field("name", $.identifier), "DECLPROC"),
        seq(/\d+/, "DECLMETHOD", field("name", $.identifier)),
      ),

    definition: ($) =>
      choice($.proc_definition, $.proc_inline_definition, $.method_definition),

    proc_definition: ($) =>
      seq(field("name", $.identifier), "PROC:<{", repeat($.instruction), "}>"),

    proc_inline_definition: ($) =>
      seq(
        field("name", $.identifier),
        "PROCINLINE:<{",
        repeat($.instruction),
        "}>",
      ),

    method_definition: ($) =>
      seq(
        field("name", $.identifier),
        "METHOD:<{",
        repeat($.instruction),
        "}>",
      ),

    instruction: ($) =>
      choice(
        $.identifier,
        $.negative_identifier,
        $.number,
        $.string,
        $.if_statement,
        $.ifjmp_statement,
        $.while_statement,
        $.repeat_statement,
        $.until_statement,
        $.proc_call,
        $.slice_literal,
        $.hex_literal,
        $.stack_ref,
        $.stack_op,
      ),

    if_statement: ($) =>
      seq(
        "IF:<{",
        repeat($.instruction),
        "}>",
        optional(seq("ELSE<{", repeat($.instruction), "}>")),
      ),

    ifjmp_statement: ($) => seq("IFJMP:<{", repeat($.instruction), "}>"),

    while_statement: ($) =>
      seq(
        "WHILE:<{",
        repeat($.instruction),
        "}>DO<{",
        repeat($.instruction),
        "}>",
      ),

    repeat_statement: ($) => seq("REPEAT:<{", repeat($.instruction), "}>"),

    until_statement: ($) => seq("UNTIL:<{", repeat($.instruction), "}>"),

    proc_call: ($) => seq($.identifier, choice("CALLDICT", "INLINECALLDICT")),

    slice_literal: ($) =>
      choice(
        seq("b{", /[01]+/, "}"),
        seq("x{", /[0-9a-fA-F_]+/, "}"),
        seq("B{", /[0-9a-fA-F_]+/, "}"),
      ),

    hex_literal: ($) => /0[xX][0-9a-fA-F]+/,

    identifier: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,

    negative_identifier: ($) => seq("-", $.identifier),

    number: ($) => /-?\d+/,

    stack_ref: ($) => seq("s", "(", /-?\d+/, ")"),

    stack_op: ($) => seq($.stack_index, $.stack_index, $.identifier),

    stack_index: ($) => seq("s", /[0-9]+/),

    string: ($) => seq('"', /[^"]*/, '"'),
  },
});
