/**
 * @file A tree-sitter grammar for the TL-B language
 * @author Petr Makhnev
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
    name: "tlb",

    extras: $ => [/\s/, $.comment],

    conflicts: $ => [],

    precedences: $ => [
        [
            "unary",
            "conditional",
            "array",
            "binary_comparison",
            "binary_addition",
            "binary_multiplication",
        ],
    ],

    rules: {
        program: $ => repeat($.source_element),

        source_element: $ => choice($.declaration, $.comment),

        comment: _ => choice(seq("//", /.*/), seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")),

        declaration: $ => seq($.constructor_, repeat($.field), "=", $.combinator, ";"),

        constructor_: $ =>
            prec.right(
                seq(
                    optional("!"),
                    choice(alias("_", $.identifier), $.identifier),
                    optional($.constructor_tag),
                ),
            ),

        constructor_tag: $ =>
            choice(
                prec.right(seq("$", choice(alias("_", $.identifier), repeat1($.binary_digit)))),
                prec.right(seq("#", choice(alias("_", $.identifier), $.hex))),
            ),

        field: $ =>
            choice(
                $.field_builtin,
                $.field_curly_expr,
                $.field_anonymous,
                $.field_named,
                $.field_expr,
            ),

        field_builtin: $ =>
            seq("{", alias($._type_identifier, $.type_identifier), ":", $.builtin_field, "}"),

        field_curly_expr: $ => seq("{", $.curly_expression, "}"),

        field_anonymous: $ => choice($.field_anon_ref, $.field_named_anon_ref),

        field_named: $ => seq($.identifier, ":", $.cond_expr),

        field_expr: $ => $.cond_expr,

        identifier: _ => /[a-zA-Z_][a-zA-Z0-9_]*/,
        _type_identifier: _ => /[a-zA-Z_][a-zA-Z0-9_]*/,
        number: _ => /[0-9]+/,
        binary_digit: _ => /[01]/,
        hex: _ => /[0-9a-fA-F]+/,

        builtin_field: _ => choice("#", "Type"),

        combinator: $ => seq(alias($._type_identifier, $.type_identifier), repeat($.simple_expr)),

        simple_expr: $ =>
            prec.left(2, choice($.negate_expr, $.binary_expression, $.ref_expr, $.parens_expr)),

        negate_expr: $ =>
            prec.right("unary", seq(field("operator", "~"), field("operand", $.simple_expr))),

        binary_expression: $ =>
            choice(
                ...[
                    ["<=", "binary_comparison"],
                    [">=", "binary_comparison"],
                    ["!=", "binary_comparison"],
                    ["=", "binary_comparison"],
                    ["<", "binary_comparison"],
                    [">", "binary_comparison"],

                    ["+", "binary_addition"],

                    ["*", "binary_multiplication"],
                ].map(([operator, precedence]) =>
                    prec.left(
                        precedence,
                        seq(
                            field("left", $.simple_expr),
                            field("operator", operator),
                            field("right", choice($.simple_expr, $.bit_size_expr)),
                        ),
                    ),
                ),
            ),

        math_expr: $ => $.binary_expression,

        ref_expr: $ => prec.left(1, choice($.ref_inner, $.parens_expr)),

        ref_inner: $ =>
            prec.left("array", choice(alias($._type_identifier, $.type_identifier), $.number)),

        parens_expr: $ => seq("(", $.simple_expr, ")"),

        cond_expr: $ =>
            choice($.cond_dot_and_question_expr, $.cond_question_expr, $.cond_type_expr),

        cond_dot_and_question_expr: $ =>
            seq(choice($.cond_dotted, $.parens_cond_dotted), "?", $.type_expr),

        cond_dotted: $ => seq($.type_expr, ".", $.number),

        parens_cond_dotted: $ => seq("(", $.cond_dotted, ")"),

        cond_question_expr: $ => seq($.type_expr, "?", $.type_expr),

        cond_type_expr: $ => prec.left("conditional", $.type_expr),

        type_expr: $ =>
            prec.left(
                1,
                choice(
                    $.cell_ref_expr,
                    $.builtin_expr,
                    $.combinator_expr,
                    $.simple_expr,
                    $.array_type,
                    $.array_multiplier,
                    $.bit_size_expr,
                    $.parens_type_expr,
                ),
            ),

        cell_ref_expr: $ => seq("^", choice($.cell_ref_inner, $.parens_cell_ref)),

        cell_ref_inner: $ =>
            choice($.combinator_expr, alias($._type_identifier, $.type_identifier)),

        parens_cell_ref: $ => seq("(", $.cell_ref_inner, ")"),

        builtin_expr: $ => choice($.builtin_one_arg, $.builtin_zero_args),

        builtin_one_arg: $ => seq("(", choice("#<=", "#<"), $.ref_expr, ")"),

        builtin_zero_args: _ => "#",

        combinator_expr: $ =>
            seq("(", alias($._type_identifier, $.type_identifier), repeat1($.type_expr), ")"),

        parens_type_expr: $ => seq("(", $.type_expr, ")"),

        compare_expr: $ => choice($.binary_expression, $.parens_compare_expr),

        parens_compare_expr: $ => seq("(", $.compare_expr, ")"),

        curly_expression: $ => $.compare_expr,

        field_anon_ref: $ => seq(optional("^"), "[", repeat($.field), "]"),

        field_named_anon_ref: $ => seq($.identifier, ":", $.field_anon_ref),

        array_type: $ =>
            prec.right(
                "array",
                seq(
                    "[",
                    field(
                        "element_type",
                        choice(alias($._type_identifier, $.type_identifier), $.type_expr),
                    ),
                    "]",
                ),
            ),

        array_multiplier: $ =>
            prec.left(
                "binary_multiplication",
                seq(field("size", $.simple_expr), "*", field("type", $.array_type)),
            ),

        bit_size_expr: $ =>
            prec.right(
                "binary_multiplication",
                seq("##", field("size", choice($.number, $.parens_expr))),
            ),
    },
})
