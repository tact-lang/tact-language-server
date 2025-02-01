#include "tree_sitter/parser.h"

#if defined(__GNUC__) || defined(__clang__)
#pragma GCC diagnostic ignored "-Wmissing-field-initializers"
#endif

#define LANGUAGE_VERSION 14
#define STATE_COUNT 159
#define LARGE_STATE_COUNT 2
#define SYMBOL_COUNT 68
#define ALIAS_COUNT 0
#define TOKEN_COUNT 40
#define EXTERNAL_TOKEN_COUNT 0
#define FIELD_COUNT 1
#define MAX_ALIAS_SEQUENCE_LENGTH 6
#define PRODUCTION_ID_COUNT 4

enum ts_symbol_identifiers {
  anon_sym_DQUOTE = 1,
  aux_sym_include_directive_token1 = 2,
  anon_sym_include = 3,
  sym_comment = 4,
  anon_sym_PROGRAM_LBRACE = 5,
  anon_sym_END_GTc = 6,
  anon_sym_DECLPROC = 7,
  aux_sym_declaration_token1 = 8,
  anon_sym_DECLMETHOD = 9,
  anon_sym_DECLGLOBVAR = 10,
  anon_sym_PROC_COLON_LT_LBRACE = 11,
  anon_sym_RBRACE_GT = 12,
  anon_sym_PROCINLINE_COLON_LT_LBRACE = 13,
  anon_sym_PROCREF_COLON_LT_LBRACE = 14,
  anon_sym_METHOD_COLON_LT_LBRACE = 15,
  anon_sym_IF_COLON_LT_LBRACE = 16,
  anon_sym_ELSE_LT_LBRACE = 17,
  anon_sym_IFJMP_COLON_LT_LBRACE = 18,
  anon_sym_WHILE_COLON_LT_LBRACE = 19,
  anon_sym_RBRACE_GTDO_LT_LBRACE = 20,
  anon_sym_REPEAT_COLON_LT_LBRACE = 21,
  anon_sym_UNTIL_COLON_LT_LBRACE = 22,
  anon_sym_CALLDICT = 23,
  anon_sym_INLINECALLDICT = 24,
  anon_sym_b_LBRACE = 25,
  aux_sym_slice_literal_token1 = 26,
  anon_sym_RBRACE = 27,
  anon_sym_x_LBRACE = 28,
  aux_sym_slice_literal_token2 = 29,
  anon_sym_B_LBRACE = 30,
  sym_hex_literal = 31,
  sym_identifier = 32,
  anon_sym_DASH = 33,
  aux_sym_number_token1 = 34,
  anon_sym_s = 35,
  anon_sym_LPAREN = 36,
  anon_sym_RPAREN = 37,
  aux_sym_stack_index_token1 = 38,
  aux_sym_string_token1 = 39,
  sym_source_file = 40,
  sym_include_directive = 41,
  sym_program = 42,
  sym_declaration = 43,
  sym_global_var = 44,
  sym_definition = 45,
  sym_proc_definition = 46,
  sym_proc_inline_definition = 47,
  sym_proc_ref_definition = 48,
  sym_method_definition = 49,
  sym_instruction = 50,
  sym_if_statement = 51,
  sym_ifjmp_statement = 52,
  sym_while_statement = 53,
  sym_repeat_statement = 54,
  sym_until_statement = 55,
  sym_proc_call = 56,
  sym_slice_literal = 57,
  sym_negative_identifier = 58,
  sym_number = 59,
  sym_stack_ref = 60,
  sym_stack_op = 61,
  sym_stack_index = 62,
  sym_string = 63,
  aux_sym_program_repeat1 = 64,
  aux_sym_program_repeat2 = 65,
  aux_sym_program_repeat3 = 66,
  aux_sym_proc_definition_repeat1 = 67,
};

static const char * const ts_symbol_names[] = {
  [ts_builtin_sym_end] = "end",
  [anon_sym_DQUOTE] = "\"",
  [aux_sym_include_directive_token1] = "include_directive_token1",
  [anon_sym_include] = "include",
  [sym_comment] = "comment",
  [anon_sym_PROGRAM_LBRACE] = "PROGRAM{",
  [anon_sym_END_GTc] = "END>c",
  [anon_sym_DECLPROC] = "DECLPROC",
  [aux_sym_declaration_token1] = "declaration_token1",
  [anon_sym_DECLMETHOD] = "DECLMETHOD",
  [anon_sym_DECLGLOBVAR] = "DECLGLOBVAR",
  [anon_sym_PROC_COLON_LT_LBRACE] = "PROC:<{",
  [anon_sym_RBRACE_GT] = "}>",
  [anon_sym_PROCINLINE_COLON_LT_LBRACE] = "PROCINLINE:<{",
  [anon_sym_PROCREF_COLON_LT_LBRACE] = "PROCREF:<{",
  [anon_sym_METHOD_COLON_LT_LBRACE] = "METHOD:<{",
  [anon_sym_IF_COLON_LT_LBRACE] = "IF:<{",
  [anon_sym_ELSE_LT_LBRACE] = "ELSE<{",
  [anon_sym_IFJMP_COLON_LT_LBRACE] = "IFJMP:<{",
  [anon_sym_WHILE_COLON_LT_LBRACE] = "WHILE:<{",
  [anon_sym_RBRACE_GTDO_LT_LBRACE] = "}>DO<{",
  [anon_sym_REPEAT_COLON_LT_LBRACE] = "REPEAT:<{",
  [anon_sym_UNTIL_COLON_LT_LBRACE] = "UNTIL:<{",
  [anon_sym_CALLDICT] = "CALLDICT",
  [anon_sym_INLINECALLDICT] = "INLINECALLDICT",
  [anon_sym_b_LBRACE] = "b{",
  [aux_sym_slice_literal_token1] = "slice_literal_token1",
  [anon_sym_RBRACE] = "}",
  [anon_sym_x_LBRACE] = "x{",
  [aux_sym_slice_literal_token2] = "slice_literal_token2",
  [anon_sym_B_LBRACE] = "B{",
  [sym_hex_literal] = "hex_literal",
  [sym_identifier] = "identifier",
  [anon_sym_DASH] = "-",
  [aux_sym_number_token1] = "number_token1",
  [anon_sym_s] = "s",
  [anon_sym_LPAREN] = "(",
  [anon_sym_RPAREN] = ")",
  [aux_sym_stack_index_token1] = "stack_index_token1",
  [aux_sym_string_token1] = "string_token1",
  [sym_source_file] = "source_file",
  [sym_include_directive] = "include_directive",
  [sym_program] = "program",
  [sym_declaration] = "declaration",
  [sym_global_var] = "global_var",
  [sym_definition] = "definition",
  [sym_proc_definition] = "proc_definition",
  [sym_proc_inline_definition] = "proc_inline_definition",
  [sym_proc_ref_definition] = "proc_ref_definition",
  [sym_method_definition] = "method_definition",
  [sym_instruction] = "instruction",
  [sym_if_statement] = "if_statement",
  [sym_ifjmp_statement] = "ifjmp_statement",
  [sym_while_statement] = "while_statement",
  [sym_repeat_statement] = "repeat_statement",
  [sym_until_statement] = "until_statement",
  [sym_proc_call] = "proc_call",
  [sym_slice_literal] = "slice_literal",
  [sym_negative_identifier] = "negative_identifier",
  [sym_number] = "number",
  [sym_stack_ref] = "stack_ref",
  [sym_stack_op] = "stack_op",
  [sym_stack_index] = "stack_index",
  [sym_string] = "string",
  [aux_sym_program_repeat1] = "program_repeat1",
  [aux_sym_program_repeat2] = "program_repeat2",
  [aux_sym_program_repeat3] = "program_repeat3",
  [aux_sym_proc_definition_repeat1] = "proc_definition_repeat1",
};

static const TSSymbol ts_symbol_map[] = {
  [ts_builtin_sym_end] = ts_builtin_sym_end,
  [anon_sym_DQUOTE] = anon_sym_DQUOTE,
  [aux_sym_include_directive_token1] = aux_sym_include_directive_token1,
  [anon_sym_include] = anon_sym_include,
  [sym_comment] = sym_comment,
  [anon_sym_PROGRAM_LBRACE] = anon_sym_PROGRAM_LBRACE,
  [anon_sym_END_GTc] = anon_sym_END_GTc,
  [anon_sym_DECLPROC] = anon_sym_DECLPROC,
  [aux_sym_declaration_token1] = aux_sym_declaration_token1,
  [anon_sym_DECLMETHOD] = anon_sym_DECLMETHOD,
  [anon_sym_DECLGLOBVAR] = anon_sym_DECLGLOBVAR,
  [anon_sym_PROC_COLON_LT_LBRACE] = anon_sym_PROC_COLON_LT_LBRACE,
  [anon_sym_RBRACE_GT] = anon_sym_RBRACE_GT,
  [anon_sym_PROCINLINE_COLON_LT_LBRACE] = anon_sym_PROCINLINE_COLON_LT_LBRACE,
  [anon_sym_PROCREF_COLON_LT_LBRACE] = anon_sym_PROCREF_COLON_LT_LBRACE,
  [anon_sym_METHOD_COLON_LT_LBRACE] = anon_sym_METHOD_COLON_LT_LBRACE,
  [anon_sym_IF_COLON_LT_LBRACE] = anon_sym_IF_COLON_LT_LBRACE,
  [anon_sym_ELSE_LT_LBRACE] = anon_sym_ELSE_LT_LBRACE,
  [anon_sym_IFJMP_COLON_LT_LBRACE] = anon_sym_IFJMP_COLON_LT_LBRACE,
  [anon_sym_WHILE_COLON_LT_LBRACE] = anon_sym_WHILE_COLON_LT_LBRACE,
  [anon_sym_RBRACE_GTDO_LT_LBRACE] = anon_sym_RBRACE_GTDO_LT_LBRACE,
  [anon_sym_REPEAT_COLON_LT_LBRACE] = anon_sym_REPEAT_COLON_LT_LBRACE,
  [anon_sym_UNTIL_COLON_LT_LBRACE] = anon_sym_UNTIL_COLON_LT_LBRACE,
  [anon_sym_CALLDICT] = anon_sym_CALLDICT,
  [anon_sym_INLINECALLDICT] = anon_sym_INLINECALLDICT,
  [anon_sym_b_LBRACE] = anon_sym_b_LBRACE,
  [aux_sym_slice_literal_token1] = aux_sym_slice_literal_token1,
  [anon_sym_RBRACE] = anon_sym_RBRACE,
  [anon_sym_x_LBRACE] = anon_sym_x_LBRACE,
  [aux_sym_slice_literal_token2] = aux_sym_slice_literal_token2,
  [anon_sym_B_LBRACE] = anon_sym_B_LBRACE,
  [sym_hex_literal] = sym_hex_literal,
  [sym_identifier] = sym_identifier,
  [anon_sym_DASH] = anon_sym_DASH,
  [aux_sym_number_token1] = aux_sym_number_token1,
  [anon_sym_s] = anon_sym_s,
  [anon_sym_LPAREN] = anon_sym_LPAREN,
  [anon_sym_RPAREN] = anon_sym_RPAREN,
  [aux_sym_stack_index_token1] = aux_sym_stack_index_token1,
  [aux_sym_string_token1] = aux_sym_string_token1,
  [sym_source_file] = sym_source_file,
  [sym_include_directive] = sym_include_directive,
  [sym_program] = sym_program,
  [sym_declaration] = sym_declaration,
  [sym_global_var] = sym_global_var,
  [sym_definition] = sym_definition,
  [sym_proc_definition] = sym_proc_definition,
  [sym_proc_inline_definition] = sym_proc_inline_definition,
  [sym_proc_ref_definition] = sym_proc_ref_definition,
  [sym_method_definition] = sym_method_definition,
  [sym_instruction] = sym_instruction,
  [sym_if_statement] = sym_if_statement,
  [sym_ifjmp_statement] = sym_ifjmp_statement,
  [sym_while_statement] = sym_while_statement,
  [sym_repeat_statement] = sym_repeat_statement,
  [sym_until_statement] = sym_until_statement,
  [sym_proc_call] = sym_proc_call,
  [sym_slice_literal] = sym_slice_literal,
  [sym_negative_identifier] = sym_negative_identifier,
  [sym_number] = sym_number,
  [sym_stack_ref] = sym_stack_ref,
  [sym_stack_op] = sym_stack_op,
  [sym_stack_index] = sym_stack_index,
  [sym_string] = sym_string,
  [aux_sym_program_repeat1] = aux_sym_program_repeat1,
  [aux_sym_program_repeat2] = aux_sym_program_repeat2,
  [aux_sym_program_repeat3] = aux_sym_program_repeat3,
  [aux_sym_proc_definition_repeat1] = aux_sym_proc_definition_repeat1,
};

static const TSSymbolMetadata ts_symbol_metadata[] = {
  [ts_builtin_sym_end] = {
    .visible = false,
    .named = true,
  },
  [anon_sym_DQUOTE] = {
    .visible = true,
    .named = false,
  },
  [aux_sym_include_directive_token1] = {
    .visible = false,
    .named = false,
  },
  [anon_sym_include] = {
    .visible = true,
    .named = false,
  },
  [sym_comment] = {
    .visible = true,
    .named = true,
  },
  [anon_sym_PROGRAM_LBRACE] = {
    .visible = true,
    .named = false,
  },
  [anon_sym_END_GTc] = {
    .visible = true,
    .named = false,
  },
  [anon_sym_DECLPROC] = {
    .visible = true,
    .named = false,
  },
  [aux_sym_declaration_token1] = {
    .visible = false,
    .named = false,
  },
  [anon_sym_DECLMETHOD] = {
    .visible = true,
    .named = false,
  },
  [anon_sym_DECLGLOBVAR] = {
    .visible = true,
    .named = false,
  },
  [anon_sym_PROC_COLON_LT_LBRACE] = {
    .visible = true,
    .named = false,
  },
  [anon_sym_RBRACE_GT] = {
    .visible = true,
    .named = false,
  },
  [anon_sym_PROCINLINE_COLON_LT_LBRACE] = {
    .visible = true,
    .named = false,
  },
  [anon_sym_PROCREF_COLON_LT_LBRACE] = {
    .visible = true,
    .named = false,
  },
  [anon_sym_METHOD_COLON_LT_LBRACE] = {
    .visible = true,
    .named = false,
  },
  [anon_sym_IF_COLON_LT_LBRACE] = {
    .visible = true,
    .named = false,
  },
  [anon_sym_ELSE_LT_LBRACE] = {
    .visible = true,
    .named = false,
  },
  [anon_sym_IFJMP_COLON_LT_LBRACE] = {
    .visible = true,
    .named = false,
  },
  [anon_sym_WHILE_COLON_LT_LBRACE] = {
    .visible = true,
    .named = false,
  },
  [anon_sym_RBRACE_GTDO_LT_LBRACE] = {
    .visible = true,
    .named = false,
  },
  [anon_sym_REPEAT_COLON_LT_LBRACE] = {
    .visible = true,
    .named = false,
  },
  [anon_sym_UNTIL_COLON_LT_LBRACE] = {
    .visible = true,
    .named = false,
  },
  [anon_sym_CALLDICT] = {
    .visible = true,
    .named = false,
  },
  [anon_sym_INLINECALLDICT] = {
    .visible = true,
    .named = false,
  },
  [anon_sym_b_LBRACE] = {
    .visible = true,
    .named = false,
  },
  [aux_sym_slice_literal_token1] = {
    .visible = false,
    .named = false,
  },
  [anon_sym_RBRACE] = {
    .visible = true,
    .named = false,
  },
  [anon_sym_x_LBRACE] = {
    .visible = true,
    .named = false,
  },
  [aux_sym_slice_literal_token2] = {
    .visible = false,
    .named = false,
  },
  [anon_sym_B_LBRACE] = {
    .visible = true,
    .named = false,
  },
  [sym_hex_literal] = {
    .visible = true,
    .named = true,
  },
  [sym_identifier] = {
    .visible = true,
    .named = true,
  },
  [anon_sym_DASH] = {
    .visible = true,
    .named = false,
  },
  [aux_sym_number_token1] = {
    .visible = false,
    .named = false,
  },
  [anon_sym_s] = {
    .visible = true,
    .named = false,
  },
  [anon_sym_LPAREN] = {
    .visible = true,
    .named = false,
  },
  [anon_sym_RPAREN] = {
    .visible = true,
    .named = false,
  },
  [aux_sym_stack_index_token1] = {
    .visible = false,
    .named = false,
  },
  [aux_sym_string_token1] = {
    .visible = false,
    .named = false,
  },
  [sym_source_file] = {
    .visible = true,
    .named = true,
  },
  [sym_include_directive] = {
    .visible = true,
    .named = true,
  },
  [sym_program] = {
    .visible = true,
    .named = true,
  },
  [sym_declaration] = {
    .visible = true,
    .named = true,
  },
  [sym_global_var] = {
    .visible = true,
    .named = true,
  },
  [sym_definition] = {
    .visible = true,
    .named = true,
  },
  [sym_proc_definition] = {
    .visible = true,
    .named = true,
  },
  [sym_proc_inline_definition] = {
    .visible = true,
    .named = true,
  },
  [sym_proc_ref_definition] = {
    .visible = true,
    .named = true,
  },
  [sym_method_definition] = {
    .visible = true,
    .named = true,
  },
  [sym_instruction] = {
    .visible = true,
    .named = true,
  },
  [sym_if_statement] = {
    .visible = true,
    .named = true,
  },
  [sym_ifjmp_statement] = {
    .visible = true,
    .named = true,
  },
  [sym_while_statement] = {
    .visible = true,
    .named = true,
  },
  [sym_repeat_statement] = {
    .visible = true,
    .named = true,
  },
  [sym_until_statement] = {
    .visible = true,
    .named = true,
  },
  [sym_proc_call] = {
    .visible = true,
    .named = true,
  },
  [sym_slice_literal] = {
    .visible = true,
    .named = true,
  },
  [sym_negative_identifier] = {
    .visible = true,
    .named = true,
  },
  [sym_number] = {
    .visible = true,
    .named = true,
  },
  [sym_stack_ref] = {
    .visible = true,
    .named = true,
  },
  [sym_stack_op] = {
    .visible = true,
    .named = true,
  },
  [sym_stack_index] = {
    .visible = true,
    .named = true,
  },
  [sym_string] = {
    .visible = true,
    .named = true,
  },
  [aux_sym_program_repeat1] = {
    .visible = false,
    .named = false,
  },
  [aux_sym_program_repeat2] = {
    .visible = false,
    .named = false,
  },
  [aux_sym_program_repeat3] = {
    .visible = false,
    .named = false,
  },
  [aux_sym_proc_definition_repeat1] = {
    .visible = false,
    .named = false,
  },
};

enum ts_field_identifiers {
  field_name = 1,
};

static const char * const ts_field_names[] = {
  [0] = NULL,
  [field_name] = "name",
};

static const TSFieldMapSlice ts_field_map_slices[PRODUCTION_ID_COUNT] = {
  [1] = {.index = 0, .length = 1},
  [2] = {.index = 1, .length = 1},
  [3] = {.index = 2, .length = 1},
};

static const TSFieldMapEntry ts_field_map_entries[] = {
  [0] =
    {field_name, 1},
  [1] =
    {field_name, 0},
  [2] =
    {field_name, 2},
};

static const TSSymbol ts_alias_sequences[PRODUCTION_ID_COUNT][MAX_ALIAS_SEQUENCE_LENGTH] = {
  [0] = {0},
};

static const uint16_t ts_non_terminal_alias_map[] = {
  0,
};

static const TSStateId ts_primary_state_ids[STATE_COUNT] = {
  [0] = 0,
  [1] = 1,
  [2] = 2,
  [3] = 3,
  [4] = 4,
  [5] = 5,
  [6] = 6,
  [7] = 7,
  [8] = 8,
  [9] = 9,
  [10] = 10,
  [11] = 11,
  [12] = 12,
  [13] = 13,
  [14] = 14,
  [15] = 15,
  [16] = 16,
  [17] = 17,
  [18] = 18,
  [19] = 19,
  [20] = 20,
  [21] = 21,
  [22] = 22,
  [23] = 23,
  [24] = 2,
  [25] = 25,
  [26] = 26,
  [27] = 3,
  [28] = 25,
  [29] = 4,
  [30] = 5,
  [31] = 6,
  [32] = 7,
  [33] = 8,
  [34] = 9,
  [35] = 35,
  [36] = 19,
  [37] = 18,
  [38] = 26,
  [39] = 17,
  [40] = 16,
  [41] = 10,
  [42] = 42,
  [43] = 13,
  [44] = 15,
  [45] = 45,
  [46] = 11,
  [47] = 12,
  [48] = 48,
  [49] = 48,
  [50] = 50,
  [51] = 50,
  [52] = 52,
  [53] = 52,
  [54] = 54,
  [55] = 55,
  [56] = 56,
  [57] = 57,
  [58] = 57,
  [59] = 56,
  [60] = 60,
  [61] = 61,
  [62] = 62,
  [63] = 63,
  [64] = 60,
  [65] = 61,
  [66] = 66,
  [67] = 62,
  [68] = 68,
  [69] = 69,
  [70] = 70,
  [71] = 63,
  [72] = 72,
  [73] = 73,
  [74] = 66,
  [75] = 75,
  [76] = 76,
  [77] = 77,
  [78] = 78,
  [79] = 79,
  [80] = 80,
  [81] = 68,
  [82] = 75,
  [83] = 54,
  [84] = 76,
  [85] = 73,
  [86] = 55,
  [87] = 80,
  [88] = 72,
  [89] = 70,
  [90] = 79,
  [91] = 78,
  [92] = 77,
  [93] = 69,
  [94] = 94,
  [95] = 95,
  [96] = 96,
  [97] = 97,
  [98] = 98,
  [99] = 99,
  [100] = 100,
  [101] = 101,
  [102] = 102,
  [103] = 103,
  [104] = 104,
  [105] = 105,
  [106] = 106,
  [107] = 107,
  [108] = 108,
  [109] = 109,
  [110] = 110,
  [111] = 111,
  [112] = 112,
  [113] = 113,
  [114] = 114,
  [115] = 115,
  [116] = 116,
  [117] = 117,
  [118] = 118,
  [119] = 118,
  [120] = 120,
  [121] = 121,
  [122] = 120,
  [123] = 123,
  [124] = 124,
  [125] = 125,
  [126] = 126,
  [127] = 127,
  [128] = 128,
  [129] = 129,
  [130] = 125,
  [131] = 131,
  [132] = 132,
  [133] = 133,
  [134] = 134,
  [135] = 131,
  [136] = 136,
  [137] = 134,
  [138] = 138,
  [139] = 139,
  [140] = 140,
  [141] = 141,
  [142] = 126,
  [143] = 143,
  [144] = 144,
  [145] = 145,
  [146] = 146,
  [147] = 147,
  [148] = 148,
  [149] = 149,
  [150] = 128,
  [151] = 151,
  [152] = 152,
  [153] = 143,
  [154] = 141,
  [155] = 151,
  [156] = 146,
  [157] = 129,
  [158] = 158,
};

static bool ts_lex(TSLexer *lexer, TSStateId state) {
  START_LEXER();
  eof = lexer->eof(lexer);
  switch (state) {
    case 0:
      if (eof) ADVANCE(136);
      ADVANCE_MAP(
        '"', 137,
        '(', 244,
        ')', 245,
        '-', 239,
        '/', 10,
        'B', 119,
        'C', 35,
        'D', 53,
        'E', 75,
        'I', 63,
        'M', 54,
        'P', 100,
        'R', 55,
        'U', 88,
        'W', 66,
        'b', 120,
        'i', 117,
        's', 242,
        'x', 121,
        '}', 172,
        '0', 148,
        '1', 148,
      );
      if (('\t' <= lookahead && lookahead <= '\r') ||
          lookahead == ' ') SKIP(0);
      if (('2' <= lookahead && lookahead <= '9')) ADVANCE(149);
      END_STATE();
    case 1:
      ADVANCE_MAP(
        '"', 137,
        '-', 239,
        '/', 10,
        '0', 240,
        'B', 235,
        'C', 186,
        'I', 202,
        'R', 196,
        'U', 222,
        'W', 205,
        'b', 236,
        's', 243,
        'x', 237,
        '}', 34,
      );
      if (('\t' <= lookahead && lookahead <= '\r') ||
          lookahead == ' ') SKIP(1);
      if (('1' <= lookahead && lookahead <= '9')) ADVANCE(241);
      if (lookahead == '$' ||
          lookahead == '%' ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 2:
      ADVANCE_MAP(
        '"', 137,
        '-', 239,
        '/', 10,
        '0', 240,
        'B', 235,
        'C', 186,
        'I', 202,
        'R', 196,
        'U', 222,
        'W', 205,
        'b', 236,
        's', 243,
        'x', 237,
        '}', 32,
      );
      if (('\t' <= lookahead && lookahead <= '\r') ||
          lookahead == ' ') SKIP(2);
      if (('1' <= lookahead && lookahead <= '9')) ADVANCE(241);
      if (lookahead == '$' ||
          lookahead == '%' ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 3:
      ADVANCE_MAP(
        '"', 137,
        '-', 239,
        '/', 10,
        '0', 240,
        'B', 235,
        'E', 211,
        'I', 203,
        'R', 196,
        'U', 222,
        'W', 205,
        'b', 236,
        's', 243,
        'x', 237,
        '}', 34,
      );
      if (('\t' <= lookahead && lookahead <= '\r') ||
          lookahead == ' ') SKIP(3);
      if (('1' <= lookahead && lookahead <= '9')) ADVANCE(241);
      if (lookahead == '$' ||
          lookahead == '%' ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 4:
      ADVANCE_MAP(
        '"', 137,
        '-', 239,
        '/', 10,
        '0', 240,
        'B', 235,
        'E', 211,
        'I', 203,
        'R', 196,
        'U', 222,
        'W', 205,
        'b', 236,
        's', 243,
        'x', 237,
        '}', 32,
      );
      if (('\t' <= lookahead && lookahead <= '\r') ||
          lookahead == ' ') SKIP(4);
      if (('1' <= lookahead && lookahead <= '9')) ADVANCE(241);
      if (lookahead == '$' ||
          lookahead == '%' ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 5:
      if (lookahead == '(') ADVANCE(244);
      if (lookahead == '/') ADVANCE(10);
      if (('\t' <= lookahead && lookahead <= '\r') ||
          lookahead == ' ') SKIP(5);
      if (('0' <= lookahead && lookahead <= '9')) ADVANCE(246);
      if (lookahead == '$' ||
          lookahead == '%' ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 6:
      if (lookahead == '-') ADVANCE(134);
      if (lookahead == '/') ADVANCE(10);
      if (('\t' <= lookahead && lookahead <= '\r') ||
          lookahead == ' ') SKIP(6);
      if (('0' <= lookahead && lookahead <= '9')) ADVANCE(241);
      END_STATE();
    case 7:
      if (lookahead == '/') ADVANCE(10);
      if (lookahead == 'D') ADVANCE(200);
      if (lookahead == 'E') ADVANCE(223);
      if (lookahead == '}') ADVANCE(171);
      if (('\t' <= lookahead && lookahead <= '\r') ||
          lookahead == ' ') SKIP(7);
      if (('0' <= lookahead && lookahead <= '9')) ADVANCE(149);
      if (lookahead == '$' ||
          lookahead == '%' ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 8:
      if (lookahead == '/') ADVANCE(10);
      if (lookahead == '0' ||
          lookahead == '1') ADVANCE(170);
      if (('\t' <= lookahead && lookahead <= '\r') ||
          lookahead == ' ') SKIP(8);
      END_STATE();
    case 9:
      if (lookahead == '/') ADVANCE(10);
      if (('\t' <= lookahead && lookahead <= '\r') ||
          lookahead == ' ') SKIP(9);
      if (('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'F') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'f')) ADVANCE(174);
      END_STATE();
    case 10:
      if (lookahead == '/') ADVANCE(144);
      END_STATE();
    case 11:
      if (lookahead == '/') ADVANCE(140);
      if (('\t' <= lookahead && lookahead <= '\r') ||
          lookahead == ' ') ADVANCE(139);
      if (lookahead != 0 &&
          lookahead != '"') ADVANCE(141);
      END_STATE();
    case 12:
      if (lookahead == ':') ADVANCE(21);
      if (lookahead == 'J') ADVANCE(86);
      END_STATE();
    case 13:
      if (lookahead == ':') ADVANCE(23);
      if (lookahead == 'I') ADVANCE(90);
      if (lookahead == 'R') ADVANCE(56);
      END_STATE();
    case 14:
      if (lookahead == ':') ADVANCE(24);
      END_STATE();
    case 15:
      if (lookahead == ':') ADVANCE(25);
      END_STATE();
    case 16:
      if (lookahead == ':') ADVANCE(26);
      END_STATE();
    case 17:
      if (lookahead == ':') ADVANCE(27);
      END_STATE();
    case 18:
      if (lookahead == ':') ADVANCE(28);
      END_STATE();
    case 19:
      if (lookahead == ':') ADVANCE(29);
      END_STATE();
    case 20:
      if (lookahead == ':') ADVANCE(30);
      END_STATE();
    case 21:
      if (lookahead == '<') ADVANCE(122);
      END_STATE();
    case 22:
      if (lookahead == '<') ADVANCE(123);
      END_STATE();
    case 23:
      if (lookahead == '<') ADVANCE(124);
      END_STATE();
    case 24:
      if (lookahead == '<') ADVANCE(125);
      END_STATE();
    case 25:
      if (lookahead == '<') ADVANCE(127);
      END_STATE();
    case 26:
      if (lookahead == '<') ADVANCE(128);
      END_STATE();
    case 27:
      if (lookahead == '<') ADVANCE(129);
      END_STATE();
    case 28:
      if (lookahead == '<') ADVANCE(130);
      END_STATE();
    case 29:
      if (lookahead == '<') ADVANCE(131);
      END_STATE();
    case 30:
      if (lookahead == '<') ADVANCE(132);
      END_STATE();
    case 31:
      if (lookahead == '<') ADVANCE(133);
      END_STATE();
    case 32:
      if (lookahead == '>') ADVANCE(154);
      END_STATE();
    case 33:
      if (lookahead == '>') ADVANCE(113);
      END_STATE();
    case 34:
      if (lookahead == '>') ADVANCE(50);
      END_STATE();
    case 35:
      if (lookahead == 'A') ADVANCE(79);
      END_STATE();
    case 36:
      if (lookahead == 'A') ADVANCE(87);
      END_STATE();
    case 37:
      if (lookahead == 'A') ADVANCE(101);
      END_STATE();
    case 38:
      if (lookahead == 'A') ADVANCE(110);
      END_STATE();
    case 39:
      if (lookahead == 'A') ADVANCE(85);
      END_STATE();
    case 40:
      if (lookahead == 'B') ADVANCE(111);
      END_STATE();
    case 41:
      if (lookahead == 'C') ADVANCE(13);
      if (lookahead == 'G') ADVANCE(102);
      END_STATE();
    case 42:
      if (lookahead == 'C') ADVANCE(147);
      END_STATE();
    case 43:
      if (lookahead == 'C') ADVANCE(76);
      END_STATE();
    case 44:
      if (lookahead == 'C') ADVANCE(105);
      END_STATE();
    case 45:
      if (lookahead == 'C') ADVANCE(106);
      END_STATE();
    case 46:
      if (lookahead == 'C') ADVANCE(39);
      END_STATE();
    case 47:
      if (lookahead == 'D') ADVANCE(33);
      END_STATE();
    case 48:
      if (lookahead == 'D') ADVANCE(150);
      END_STATE();
    case 49:
      if (lookahead == 'D') ADVANCE(70);
      END_STATE();
    case 50:
      if (lookahead == 'D') ADVANCE(97);
      END_STATE();
    case 51:
      if (lookahead == 'D') ADVANCE(74);
      END_STATE();
    case 52:
      if (lookahead == 'D') ADVANCE(17);
      END_STATE();
    case 53:
      if (lookahead == 'E') ADVANCE(43);
      END_STATE();
    case 54:
      if (lookahead == 'E') ADVANCE(107);
      END_STATE();
    case 55:
      if (lookahead == 'E') ADVANCE(99);
      END_STATE();
    case 56:
      if (lookahead == 'E') ADVANCE(64);
      END_STATE();
    case 57:
      if (lookahead == 'E') ADVANCE(38);
      END_STATE();
    case 58:
      if (lookahead == 'E') ADVANCE(46);
      END_STATE();
    case 59:
      if (lookahead == 'E') ADVANCE(22);
      END_STATE();
    case 60:
      if (lookahead == 'E') ADVANCE(16);
      END_STATE();
    case 61:
      if (lookahead == 'E') ADVANCE(20);
      END_STATE();
    case 62:
      if (lookahead == 'E') ADVANCE(109);
      END_STATE();
    case 63:
      if (lookahead == 'F') ADVANCE(12);
      if (lookahead == 'N') ADVANCE(78);
      END_STATE();
    case 64:
      if (lookahead == 'F') ADVANCE(19);
      END_STATE();
    case 65:
      if (lookahead == 'G') ADVANCE(80);
      if (lookahead == 'M') ADVANCE(62);
      if (lookahead == 'P') ADVANCE(103);
      END_STATE();
    case 66:
      if (lookahead == 'H') ADVANCE(72);
      END_STATE();
    case 67:
      if (lookahead == 'H') ADVANCE(94);
      END_STATE();
    case 68:
      if (lookahead == 'H') ADVANCE(96);
      END_STATE();
    case 69:
      if (lookahead == 'I') ADVANCE(89);
      END_STATE();
    case 70:
      if (lookahead == 'I') ADVANCE(44);
      END_STATE();
    case 71:
      if (lookahead == 'I') ADVANCE(91);
      END_STATE();
    case 72:
      if (lookahead == 'I') ADVANCE(82);
      END_STATE();
    case 73:
      if (lookahead == 'I') ADVANCE(83);
      END_STATE();
    case 74:
      if (lookahead == 'I') ADVANCE(45);
      END_STATE();
    case 75:
      if (lookahead == 'L') ADVANCE(104);
      if (lookahead == 'N') ADVANCE(47);
      END_STATE();
    case 76:
      if (lookahead == 'L') ADVANCE(65);
      END_STATE();
    case 77:
      if (lookahead == 'L') ADVANCE(49);
      END_STATE();
    case 78:
      if (lookahead == 'L') ADVANCE(69);
      END_STATE();
    case 79:
      if (lookahead == 'L') ADVANCE(77);
      END_STATE();
    case 80:
      if (lookahead == 'L') ADVANCE(93);
      END_STATE();
    case 81:
      if (lookahead == 'L') ADVANCE(71);
      END_STATE();
    case 82:
      if (lookahead == 'L') ADVANCE(60);
      END_STATE();
    case 83:
      if (lookahead == 'L') ADVANCE(15);
      END_STATE();
    case 84:
      if (lookahead == 'L') ADVANCE(51);
      END_STATE();
    case 85:
      if (lookahead == 'L') ADVANCE(84);
      END_STATE();
    case 86:
      if (lookahead == 'M') ADVANCE(98);
      END_STATE();
    case 87:
      if (lookahead == 'M') ADVANCE(126);
      END_STATE();
    case 88:
      if (lookahead == 'N') ADVANCE(108);
      END_STATE();
    case 89:
      if (lookahead == 'N') ADVANCE(58);
      END_STATE();
    case 90:
      if (lookahead == 'N') ADVANCE(81);
      END_STATE();
    case 91:
      if (lookahead == 'N') ADVANCE(61);
      END_STATE();
    case 92:
      if (lookahead == 'O') ADVANCE(41);
      END_STATE();
    case 93:
      if (lookahead == 'O') ADVANCE(40);
      END_STATE();
    case 94:
      if (lookahead == 'O') ADVANCE(52);
      END_STATE();
    case 95:
      if (lookahead == 'O') ADVANCE(42);
      END_STATE();
    case 96:
      if (lookahead == 'O') ADVANCE(48);
      END_STATE();
    case 97:
      if (lookahead == 'O') ADVANCE(31);
      END_STATE();
    case 98:
      if (lookahead == 'P') ADVANCE(14);
      END_STATE();
    case 99:
      if (lookahead == 'P') ADVANCE(57);
      END_STATE();
    case 100:
      if (lookahead == 'R') ADVANCE(92);
      END_STATE();
    case 101:
      if (lookahead == 'R') ADVANCE(151);
      END_STATE();
    case 102:
      if (lookahead == 'R') ADVANCE(36);
      END_STATE();
    case 103:
      if (lookahead == 'R') ADVANCE(95);
      END_STATE();
    case 104:
      if (lookahead == 'S') ADVANCE(59);
      END_STATE();
    case 105:
      if (lookahead == 'T') ADVANCE(165);
      END_STATE();
    case 106:
      if (lookahead == 'T') ADVANCE(167);
      END_STATE();
    case 107:
      if (lookahead == 'T') ADVANCE(67);
      END_STATE();
    case 108:
      if (lookahead == 'T') ADVANCE(73);
      END_STATE();
    case 109:
      if (lookahead == 'T') ADVANCE(68);
      END_STATE();
    case 110:
      if (lookahead == 'T') ADVANCE(18);
      END_STATE();
    case 111:
      if (lookahead == 'V') ADVANCE(37);
      END_STATE();
    case 112:
      if (lookahead == 'c') ADVANCE(116);
      END_STATE();
    case 113:
      if (lookahead == 'c') ADVANCE(146);
      END_STATE();
    case 114:
      if (lookahead == 'd') ADVANCE(115);
      END_STATE();
    case 115:
      if (lookahead == 'e') ADVANCE(142);
      END_STATE();
    case 116:
      if (lookahead == 'l') ADVANCE(118);
      END_STATE();
    case 117:
      if (lookahead == 'n') ADVANCE(112);
      END_STATE();
    case 118:
      if (lookahead == 'u') ADVANCE(114);
      END_STATE();
    case 119:
      if (lookahead == '{') ADVANCE(175);
      END_STATE();
    case 120:
      if (lookahead == '{') ADVANCE(169);
      END_STATE();
    case 121:
      if (lookahead == '{') ADVANCE(173);
      END_STATE();
    case 122:
      if (lookahead == '{') ADVANCE(158);
      END_STATE();
    case 123:
      if (lookahead == '{') ADVANCE(159);
      END_STATE();
    case 124:
      if (lookahead == '{') ADVANCE(153);
      END_STATE();
    case 125:
      if (lookahead == '{') ADVANCE(160);
      END_STATE();
    case 126:
      if (lookahead == '{') ADVANCE(145);
      END_STATE();
    case 127:
      if (lookahead == '{') ADVANCE(164);
      END_STATE();
    case 128:
      if (lookahead == '{') ADVANCE(161);
      END_STATE();
    case 129:
      if (lookahead == '{') ADVANCE(157);
      END_STATE();
    case 130:
      if (lookahead == '{') ADVANCE(163);
      END_STATE();
    case 131:
      if (lookahead == '{') ADVANCE(156);
      END_STATE();
    case 132:
      if (lookahead == '{') ADVANCE(155);
      END_STATE();
    case 133:
      if (lookahead == '{') ADVANCE(162);
      END_STATE();
    case 134:
      if (('0' <= lookahead && lookahead <= '9')) ADVANCE(241);
      END_STATE();
    case 135:
      if (('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'F') ||
          ('a' <= lookahead && lookahead <= 'f')) ADVANCE(176);
      END_STATE();
    case 136:
      ACCEPT_TOKEN(ts_builtin_sym_end);
      END_STATE();
    case 137:
      ACCEPT_TOKEN(anon_sym_DQUOTE);
      END_STATE();
    case 138:
      ACCEPT_TOKEN(aux_sym_include_directive_token1);
      if (lookahead == '\n') ADVANCE(141);
      if (lookahead == '"') ADVANCE(144);
      if (lookahead != 0) ADVANCE(138);
      END_STATE();
    case 139:
      ACCEPT_TOKEN(aux_sym_include_directive_token1);
      if (lookahead == '/') ADVANCE(140);
      if (('\t' <= lookahead && lookahead <= '\r') ||
          lookahead == ' ') ADVANCE(139);
      if (lookahead != 0 &&
          lookahead != '"') ADVANCE(141);
      END_STATE();
    case 140:
      ACCEPT_TOKEN(aux_sym_include_directive_token1);
      if (lookahead == '/') ADVANCE(138);
      if (lookahead != 0 &&
          lookahead != '"') ADVANCE(141);
      END_STATE();
    case 141:
      ACCEPT_TOKEN(aux_sym_include_directive_token1);
      if (lookahead != 0 &&
          lookahead != '"') ADVANCE(141);
      END_STATE();
    case 142:
      ACCEPT_TOKEN(anon_sym_include);
      END_STATE();
    case 143:
      ACCEPT_TOKEN(sym_comment);
      if (lookahead == '\n') ADVANCE(249);
      if (lookahead == '"') ADVANCE(144);
      if (lookahead != 0) ADVANCE(143);
      END_STATE();
    case 144:
      ACCEPT_TOKEN(sym_comment);
      if (lookahead != 0 &&
          lookahead != '\n') ADVANCE(144);
      END_STATE();
    case 145:
      ACCEPT_TOKEN(anon_sym_PROGRAM_LBRACE);
      END_STATE();
    case 146:
      ACCEPT_TOKEN(anon_sym_END_GTc);
      END_STATE();
    case 147:
      ACCEPT_TOKEN(anon_sym_DECLPROC);
      END_STATE();
    case 148:
      ACCEPT_TOKEN(aux_sym_declaration_token1);
      if (lookahead == '0' ||
          lookahead == '1') ADVANCE(148);
      if (('2' <= lookahead && lookahead <= '9')) ADVANCE(149);
      END_STATE();
    case 149:
      ACCEPT_TOKEN(aux_sym_declaration_token1);
      if (('0' <= lookahead && lookahead <= '9')) ADVANCE(149);
      END_STATE();
    case 150:
      ACCEPT_TOKEN(anon_sym_DECLMETHOD);
      END_STATE();
    case 151:
      ACCEPT_TOKEN(anon_sym_DECLGLOBVAR);
      END_STATE();
    case 152:
      ACCEPT_TOKEN(anon_sym_DECLGLOBVAR);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 153:
      ACCEPT_TOKEN(anon_sym_PROC_COLON_LT_LBRACE);
      END_STATE();
    case 154:
      ACCEPT_TOKEN(anon_sym_RBRACE_GT);
      END_STATE();
    case 155:
      ACCEPT_TOKEN(anon_sym_PROCINLINE_COLON_LT_LBRACE);
      END_STATE();
    case 156:
      ACCEPT_TOKEN(anon_sym_PROCREF_COLON_LT_LBRACE);
      END_STATE();
    case 157:
      ACCEPT_TOKEN(anon_sym_METHOD_COLON_LT_LBRACE);
      END_STATE();
    case 158:
      ACCEPT_TOKEN(anon_sym_IF_COLON_LT_LBRACE);
      END_STATE();
    case 159:
      ACCEPT_TOKEN(anon_sym_ELSE_LT_LBRACE);
      END_STATE();
    case 160:
      ACCEPT_TOKEN(anon_sym_IFJMP_COLON_LT_LBRACE);
      END_STATE();
    case 161:
      ACCEPT_TOKEN(anon_sym_WHILE_COLON_LT_LBRACE);
      END_STATE();
    case 162:
      ACCEPT_TOKEN(anon_sym_RBRACE_GTDO_LT_LBRACE);
      END_STATE();
    case 163:
      ACCEPT_TOKEN(anon_sym_REPEAT_COLON_LT_LBRACE);
      END_STATE();
    case 164:
      ACCEPT_TOKEN(anon_sym_UNTIL_COLON_LT_LBRACE);
      END_STATE();
    case 165:
      ACCEPT_TOKEN(anon_sym_CALLDICT);
      END_STATE();
    case 166:
      ACCEPT_TOKEN(anon_sym_CALLDICT);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 167:
      ACCEPT_TOKEN(anon_sym_INLINECALLDICT);
      END_STATE();
    case 168:
      ACCEPT_TOKEN(anon_sym_INLINECALLDICT);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 169:
      ACCEPT_TOKEN(anon_sym_b_LBRACE);
      END_STATE();
    case 170:
      ACCEPT_TOKEN(aux_sym_slice_literal_token1);
      if (lookahead == '0' ||
          lookahead == '1') ADVANCE(170);
      END_STATE();
    case 171:
      ACCEPT_TOKEN(anon_sym_RBRACE);
      END_STATE();
    case 172:
      ACCEPT_TOKEN(anon_sym_RBRACE);
      if (lookahead == '>') ADVANCE(154);
      END_STATE();
    case 173:
      ACCEPT_TOKEN(anon_sym_x_LBRACE);
      END_STATE();
    case 174:
      ACCEPT_TOKEN(aux_sym_slice_literal_token2);
      if (('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'F') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'f')) ADVANCE(174);
      END_STATE();
    case 175:
      ACCEPT_TOKEN(anon_sym_B_LBRACE);
      END_STATE();
    case 176:
      ACCEPT_TOKEN(sym_hex_literal);
      if (('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'F') ||
          ('a' <= lookahead && lookahead <= 'f')) ADVANCE(176);
      END_STATE();
    case 177:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == ':') ADVANCE(21);
      if (lookahead == 'J') ADVANCE(221);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 178:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == ':') ADVANCE(24);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 179:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == ':') ADVANCE(25);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 180:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == ':') ADVANCE(26);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 181:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == ':') ADVANCE(28);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 182:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == '<') ADVANCE(123);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 183:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == '>') ADVANCE(113);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 184:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'A') ADVANCE(228);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('B' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 185:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'A') ADVANCE(233);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('B' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 186:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'A') ADVANCE(217);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('B' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 187:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'A') ADVANCE(220);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('B' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 188:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'B') ADVANCE(234);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 189:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'C') ADVANCE(230);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 190:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'C') ADVANCE(231);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 191:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'C') ADVANCE(213);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 192:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'C') ADVANCE(187);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 193:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'D') ADVANCE(183);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 194:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'D') ADVANCE(206);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 195:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'D') ADVANCE(210);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 196:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'E') ADVANCE(227);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 197:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'E') ADVANCE(182);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 198:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'E') ADVANCE(185);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 199:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'E') ADVANCE(192);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 200:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'E') ADVANCE(191);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 201:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'E') ADVANCE(180);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 202:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'F') ADVANCE(177);
      if (lookahead == 'N') ADVANCE(215);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 203:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'F') ADVANCE(177);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 204:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'G') ADVANCE(214);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 205:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'H') ADVANCE(207);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 206:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'I') ADVANCE(189);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 207:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'I') ADVANCE(216);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 208:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'I') ADVANCE(224);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 209:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'I') ADVANCE(218);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 210:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'I') ADVANCE(190);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 211:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'L') ADVANCE(229);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 212:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'L') ADVANCE(194);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 213:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'L') ADVANCE(204);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 214:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'L') ADVANCE(225);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 215:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'L') ADVANCE(208);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 216:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'L') ADVANCE(201);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 217:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'L') ADVANCE(212);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 218:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'L') ADVANCE(179);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 219:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'L') ADVANCE(195);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 220:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'L') ADVANCE(219);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 221:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'M') ADVANCE(226);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 222:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'N') ADVANCE(232);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 223:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'N') ADVANCE(193);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 224:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'N') ADVANCE(199);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 225:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'O') ADVANCE(188);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 226:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'P') ADVANCE(178);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 227:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'P') ADVANCE(198);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 228:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'R') ADVANCE(152);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 229:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'S') ADVANCE(197);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 230:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'T') ADVANCE(166);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 231:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'T') ADVANCE(168);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 232:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'T') ADVANCE(209);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 233:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'T') ADVANCE(181);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 234:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == 'V') ADVANCE(184);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 235:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == '{') ADVANCE(175);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 236:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == '{') ADVANCE(169);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 237:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == '{') ADVANCE(173);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 238:
      ACCEPT_TOKEN(sym_identifier);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 239:
      ACCEPT_TOKEN(anon_sym_DASH);
      if (('0' <= lookahead && lookahead <= '9')) ADVANCE(241);
      END_STATE();
    case 240:
      ACCEPT_TOKEN(aux_sym_number_token1);
      if (lookahead == 'X' ||
          lookahead == 'x') ADVANCE(135);
      if (('0' <= lookahead && lookahead <= '9')) ADVANCE(241);
      END_STATE();
    case 241:
      ACCEPT_TOKEN(aux_sym_number_token1);
      if (('0' <= lookahead && lookahead <= '9')) ADVANCE(241);
      END_STATE();
    case 242:
      ACCEPT_TOKEN(anon_sym_s);
      END_STATE();
    case 243:
      ACCEPT_TOKEN(anon_sym_s);
      if (lookahead == '$' ||
          ('0' <= lookahead && lookahead <= '9') ||
          ('A' <= lookahead && lookahead <= 'Z') ||
          lookahead == '_' ||
          ('a' <= lookahead && lookahead <= 'z')) ADVANCE(238);
      END_STATE();
    case 244:
      ACCEPT_TOKEN(anon_sym_LPAREN);
      END_STATE();
    case 245:
      ACCEPT_TOKEN(anon_sym_RPAREN);
      END_STATE();
    case 246:
      ACCEPT_TOKEN(aux_sym_stack_index_token1);
      if (('0' <= lookahead && lookahead <= '9')) ADVANCE(246);
      END_STATE();
    case 247:
      ACCEPT_TOKEN(aux_sym_string_token1);
      if (lookahead == '/') ADVANCE(248);
      if (('\t' <= lookahead && lookahead <= '\r') ||
          lookahead == ' ') ADVANCE(247);
      if (lookahead != 0 &&
          lookahead != '"') ADVANCE(249);
      END_STATE();
    case 248:
      ACCEPT_TOKEN(aux_sym_string_token1);
      if (lookahead == '/') ADVANCE(143);
      if (lookahead != 0 &&
          lookahead != '"') ADVANCE(249);
      END_STATE();
    case 249:
      ACCEPT_TOKEN(aux_sym_string_token1);
      if (lookahead != 0 &&
          lookahead != '"') ADVANCE(249);
      END_STATE();
    default:
      return false;
  }
}

static const TSLexMode ts_lex_modes[STATE_COUNT] = {
  [0] = {.lex_state = 0},
  [1] = {.lex_state = 0},
  [2] = {.lex_state = 3},
  [3] = {.lex_state = 3},
  [4] = {.lex_state = 4},
  [5] = {.lex_state = 4},
  [6] = {.lex_state = 4},
  [7] = {.lex_state = 4},
  [8] = {.lex_state = 4},
  [9] = {.lex_state = 4},
  [10] = {.lex_state = 4},
  [11] = {.lex_state = 4},
  [12] = {.lex_state = 4},
  [13] = {.lex_state = 4},
  [14] = {.lex_state = 4},
  [15] = {.lex_state = 4},
  [16] = {.lex_state = 4},
  [17] = {.lex_state = 4},
  [18] = {.lex_state = 4},
  [19] = {.lex_state = 4},
  [20] = {.lex_state = 4},
  [21] = {.lex_state = 4},
  [22] = {.lex_state = 4},
  [23] = {.lex_state = 4},
  [24] = {.lex_state = 4},
  [25] = {.lex_state = 4},
  [26] = {.lex_state = 3},
  [27] = {.lex_state = 3},
  [28] = {.lex_state = 4},
  [29] = {.lex_state = 4},
  [30] = {.lex_state = 4},
  [31] = {.lex_state = 4},
  [32] = {.lex_state = 4},
  [33] = {.lex_state = 4},
  [34] = {.lex_state = 4},
  [35] = {.lex_state = 4},
  [36] = {.lex_state = 4},
  [37] = {.lex_state = 4},
  [38] = {.lex_state = 3},
  [39] = {.lex_state = 4},
  [40] = {.lex_state = 4},
  [41] = {.lex_state = 4},
  [42] = {.lex_state = 4},
  [43] = {.lex_state = 4},
  [44] = {.lex_state = 4},
  [45] = {.lex_state = 4},
  [46] = {.lex_state = 4},
  [47] = {.lex_state = 4},
  [48] = {.lex_state = 2},
  [49] = {.lex_state = 1},
  [50] = {.lex_state = 4},
  [51] = {.lex_state = 3},
  [52] = {.lex_state = 4},
  [53] = {.lex_state = 3},
  [54] = {.lex_state = 3},
  [55] = {.lex_state = 3},
  [56] = {.lex_state = 4},
  [57] = {.lex_state = 3},
  [58] = {.lex_state = 4},
  [59] = {.lex_state = 3},
  [60] = {.lex_state = 4},
  [61] = {.lex_state = 4},
  [62] = {.lex_state = 4},
  [63] = {.lex_state = 4},
  [64] = {.lex_state = 3},
  [65] = {.lex_state = 3},
  [66] = {.lex_state = 4},
  [67] = {.lex_state = 3},
  [68] = {.lex_state = 4},
  [69] = {.lex_state = 4},
  [70] = {.lex_state = 4},
  [71] = {.lex_state = 3},
  [72] = {.lex_state = 4},
  [73] = {.lex_state = 4},
  [74] = {.lex_state = 3},
  [75] = {.lex_state = 3},
  [76] = {.lex_state = 3},
  [77] = {.lex_state = 3},
  [78] = {.lex_state = 3},
  [79] = {.lex_state = 3},
  [80] = {.lex_state = 3},
  [81] = {.lex_state = 3},
  [82] = {.lex_state = 4},
  [83] = {.lex_state = 4},
  [84] = {.lex_state = 4},
  [85] = {.lex_state = 3},
  [86] = {.lex_state = 4},
  [87] = {.lex_state = 4},
  [88] = {.lex_state = 3},
  [89] = {.lex_state = 3},
  [90] = {.lex_state = 4},
  [91] = {.lex_state = 4},
  [92] = {.lex_state = 4},
  [93] = {.lex_state = 3},
  [94] = {.lex_state = 7},
  [95] = {.lex_state = 7},
  [96] = {.lex_state = 7},
  [97] = {.lex_state = 7},
  [98] = {.lex_state = 7},
  [99] = {.lex_state = 7},
  [100] = {.lex_state = 0},
  [101] = {.lex_state = 7},
  [102] = {.lex_state = 0},
  [103] = {.lex_state = 0},
  [104] = {.lex_state = 0},
  [105] = {.lex_state = 7},
  [106] = {.lex_state = 0},
  [107] = {.lex_state = 0},
  [108] = {.lex_state = 7},
  [109] = {.lex_state = 7},
  [110] = {.lex_state = 7},
  [111] = {.lex_state = 7},
  [112] = {.lex_state = 7},
  [113] = {.lex_state = 7},
  [114] = {.lex_state = 7},
  [115] = {.lex_state = 7},
  [116] = {.lex_state = 7},
  [117] = {.lex_state = 0},
  [118] = {.lex_state = 5},
  [119] = {.lex_state = 5},
  [120] = {.lex_state = 0},
  [121] = {.lex_state = 0},
  [122] = {.lex_state = 0},
  [123] = {.lex_state = 0},
  [124] = {.lex_state = 0},
  [125] = {.lex_state = 7},
  [126] = {.lex_state = 5},
  [127] = {.lex_state = 5},
  [128] = {.lex_state = 0},
  [129] = {.lex_state = 6},
  [130] = {.lex_state = 7},
  [131] = {.lex_state = 0},
  [132] = {.lex_state = 0},
  [133] = {.lex_state = 5},
  [134] = {.lex_state = 5},
  [135] = {.lex_state = 0},
  [136] = {.lex_state = 0},
  [137] = {.lex_state = 5},
  [138] = {.lex_state = 0},
  [139] = {.lex_state = 0},
  [140] = {.lex_state = 11},
  [141] = {.lex_state = 9},
  [142] = {.lex_state = 5},
  [143] = {.lex_state = 8},
  [144] = {.lex_state = 5},
  [145] = {.lex_state = 0},
  [146] = {.lex_state = 0},
  [147] = {.lex_state = 0},
  [148] = {.lex_state = 0},
  [149] = {.lex_state = 0},
  [150] = {.lex_state = 5},
  [151] = {.lex_state = 247},
  [152] = {.lex_state = 0},
  [153] = {.lex_state = 8},
  [154] = {.lex_state = 9},
  [155] = {.lex_state = 247},
  [156] = {.lex_state = 0},
  [157] = {.lex_state = 6},
  [158] = {.lex_state = 0},
};

static const uint16_t ts_parse_table[LARGE_STATE_COUNT][SYMBOL_COUNT] = {
  [0] = {
    [ts_builtin_sym_end] = ACTIONS(1),
    [anon_sym_DQUOTE] = ACTIONS(1),
    [anon_sym_include] = ACTIONS(1),
    [sym_comment] = ACTIONS(3),
    [anon_sym_PROGRAM_LBRACE] = ACTIONS(1),
    [anon_sym_END_GTc] = ACTIONS(1),
    [anon_sym_DECLPROC] = ACTIONS(1),
    [aux_sym_declaration_token1] = ACTIONS(1),
    [anon_sym_DECLMETHOD] = ACTIONS(1),
    [anon_sym_DECLGLOBVAR] = ACTIONS(1),
    [anon_sym_PROC_COLON_LT_LBRACE] = ACTIONS(1),
    [anon_sym_RBRACE_GT] = ACTIONS(1),
    [anon_sym_PROCINLINE_COLON_LT_LBRACE] = ACTIONS(1),
    [anon_sym_PROCREF_COLON_LT_LBRACE] = ACTIONS(1),
    [anon_sym_METHOD_COLON_LT_LBRACE] = ACTIONS(1),
    [anon_sym_IF_COLON_LT_LBRACE] = ACTIONS(1),
    [anon_sym_ELSE_LT_LBRACE] = ACTIONS(1),
    [anon_sym_IFJMP_COLON_LT_LBRACE] = ACTIONS(1),
    [anon_sym_WHILE_COLON_LT_LBRACE] = ACTIONS(1),
    [anon_sym_REPEAT_COLON_LT_LBRACE] = ACTIONS(1),
    [anon_sym_UNTIL_COLON_LT_LBRACE] = ACTIONS(1),
    [anon_sym_CALLDICT] = ACTIONS(1),
    [anon_sym_INLINECALLDICT] = ACTIONS(1),
    [anon_sym_b_LBRACE] = ACTIONS(1),
    [aux_sym_slice_literal_token1] = ACTIONS(1),
    [anon_sym_RBRACE] = ACTIONS(1),
    [anon_sym_x_LBRACE] = ACTIONS(1),
    [anon_sym_B_LBRACE] = ACTIONS(1),
    [anon_sym_DASH] = ACTIONS(1),
    [aux_sym_number_token1] = ACTIONS(1),
    [anon_sym_s] = ACTIONS(1),
    [anon_sym_LPAREN] = ACTIONS(1),
    [anon_sym_RPAREN] = ACTIONS(1),
    [aux_sym_stack_index_token1] = ACTIONS(1),
  },
  [1] = {
    [sym_source_file] = STATE(152),
    [sym_include_directive] = STATE(121),
    [sym_program] = STATE(149),
    [anon_sym_DQUOTE] = ACTIONS(5),
    [sym_comment] = ACTIONS(3),
    [anon_sym_PROGRAM_LBRACE] = ACTIONS(7),
  },
};

static const uint16_t ts_small_parse_table[] = {
  [0] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(9), 1,
      anon_sym_DQUOTE,
    ACTIONS(12), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(15), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(18), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(21), 1,
      anon_sym_RBRACE_GTDO_LT_LBRACE,
    ACTIONS(23), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(26), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(29), 1,
      anon_sym_b_LBRACE,
    ACTIONS(35), 1,
      sym_hex_literal,
    ACTIONS(38), 1,
      sym_identifier,
    ACTIONS(41), 1,
      anon_sym_DASH,
    ACTIONS(44), 1,
      aux_sym_number_token1,
    ACTIONS(47), 1,
      anon_sym_s,
    STATE(120), 1,
      sym_stack_index,
    ACTIONS(32), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(2), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(59), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [68] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(50), 1,
      anon_sym_DQUOTE,
    ACTIONS(52), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(54), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(56), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(58), 1,
      anon_sym_RBRACE_GTDO_LT_LBRACE,
    ACTIONS(60), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(62), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(64), 1,
      anon_sym_b_LBRACE,
    ACTIONS(68), 1,
      sym_hex_literal,
    ACTIONS(70), 1,
      sym_identifier,
    ACTIONS(72), 1,
      anon_sym_DASH,
    ACTIONS(74), 1,
      aux_sym_number_token1,
    ACTIONS(76), 1,
      anon_sym_s,
    STATE(120), 1,
      sym_stack_index,
    ACTIONS(66), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(2), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(59), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [136] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(80), 1,
      anon_sym_RBRACE_GT,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(24), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [204] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(106), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(24), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [272] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(108), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(4), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [340] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(108), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(24), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [408] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(110), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(5), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [476] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(110), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(24), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [544] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(112), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(7), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [612] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(114), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(24), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [680] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(116), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(24), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [748] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(118), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(9), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [816] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(120), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(24), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [884] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(122), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(24), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [952] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(124), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(11), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [1020] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(126), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(12), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [1088] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(128), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(28), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [1156] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(130), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(15), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [1224] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(132), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(45), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [1292] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(134), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(35), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [1360] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(136), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(14), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [1428] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(138), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(42), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [1496] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(21), 1,
      anon_sym_RBRACE_GT,
    ACTIONS(140), 1,
      anon_sym_DQUOTE,
    ACTIONS(143), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(146), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(149), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(152), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(155), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(158), 1,
      anon_sym_b_LBRACE,
    ACTIONS(164), 1,
      sym_hex_literal,
    ACTIONS(167), 1,
      sym_identifier,
    ACTIONS(170), 1,
      anon_sym_DASH,
    ACTIONS(173), 1,
      aux_sym_number_token1,
    ACTIONS(176), 1,
      anon_sym_s,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(161), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(24), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [1564] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(179), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(24), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [1632] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(50), 1,
      anon_sym_DQUOTE,
    ACTIONS(52), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(54), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(56), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(60), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(62), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(64), 1,
      anon_sym_b_LBRACE,
    ACTIONS(68), 1,
      sym_hex_literal,
    ACTIONS(70), 1,
      sym_identifier,
    ACTIONS(72), 1,
      anon_sym_DASH,
    ACTIONS(74), 1,
      aux_sym_number_token1,
    ACTIONS(76), 1,
      anon_sym_s,
    ACTIONS(181), 1,
      anon_sym_RBRACE_GTDO_LT_LBRACE,
    STATE(120), 1,
      sym_stack_index,
    ACTIONS(66), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(27), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(59), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [1700] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(50), 1,
      anon_sym_DQUOTE,
    ACTIONS(52), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(54), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(56), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(60), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(62), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(64), 1,
      anon_sym_b_LBRACE,
    ACTIONS(68), 1,
      sym_hex_literal,
    ACTIONS(70), 1,
      sym_identifier,
    ACTIONS(72), 1,
      anon_sym_DASH,
    ACTIONS(74), 1,
      aux_sym_number_token1,
    ACTIONS(76), 1,
      anon_sym_s,
    ACTIONS(183), 1,
      anon_sym_RBRACE_GTDO_LT_LBRACE,
    STATE(120), 1,
      sym_stack_index,
    ACTIONS(66), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(2), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(59), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [1768] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(185), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(24), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [1836] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(187), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(24), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [1904] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(189), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(24), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [1972] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(191), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(29), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [2040] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(191), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(24), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [2108] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(193), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(30), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [2176] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(193), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(24), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [2244] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(195), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(24), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [2312] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(197), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(44), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [2380] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(199), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(25), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [2448] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(50), 1,
      anon_sym_DQUOTE,
    ACTIONS(52), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(54), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(56), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(60), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(62), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(64), 1,
      anon_sym_b_LBRACE,
    ACTIONS(68), 1,
      sym_hex_literal,
    ACTIONS(70), 1,
      sym_identifier,
    ACTIONS(72), 1,
      anon_sym_DASH,
    ACTIONS(74), 1,
      aux_sym_number_token1,
    ACTIONS(76), 1,
      anon_sym_s,
    ACTIONS(201), 1,
      anon_sym_RBRACE_GTDO_LT_LBRACE,
    STATE(120), 1,
      sym_stack_index,
    ACTIONS(66), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(3), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(59), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [2516] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(203), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(47), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [2584] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(205), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(46), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [2652] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(207), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(32), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [2720] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(209), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(24), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [2788] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(211), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(34), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [2856] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(213), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(24), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [2924] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(215), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(24), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [2992] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(217), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(24), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [3060] = 18,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(78), 1,
      anon_sym_DQUOTE,
    ACTIONS(82), 1,
      anon_sym_IF_COLON_LT_LBRACE,
    ACTIONS(84), 1,
      anon_sym_IFJMP_COLON_LT_LBRACE,
    ACTIONS(86), 1,
      anon_sym_WHILE_COLON_LT_LBRACE,
    ACTIONS(88), 1,
      anon_sym_REPEAT_COLON_LT_LBRACE,
    ACTIONS(90), 1,
      anon_sym_UNTIL_COLON_LT_LBRACE,
    ACTIONS(92), 1,
      anon_sym_b_LBRACE,
    ACTIONS(96), 1,
      sym_hex_literal,
    ACTIONS(98), 1,
      sym_identifier,
    ACTIONS(100), 1,
      anon_sym_DASH,
    ACTIONS(102), 1,
      aux_sym_number_token1,
    ACTIONS(104), 1,
      anon_sym_s,
    ACTIONS(219), 1,
      anon_sym_RBRACE_GT,
    STATE(122), 1,
      sym_stack_index,
    ACTIONS(94), 2,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
    STATE(24), 2,
      sym_instruction,
      aux_sym_proc_definition_repeat1,
    STATE(56), 12,
      sym_if_statement,
      sym_ifjmp_statement,
      sym_while_statement,
      sym_repeat_statement,
      sym_until_statement,
      sym_proc_call,
      sym_slice_literal,
      sym_negative_identifier,
      sym_number,
      sym_stack_ref,
      sym_stack_op,
      sym_string,
  [3128] = 4,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(223), 2,
      anon_sym_CALLDICT,
      anon_sym_INLINECALLDICT,
    ACTIONS(225), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(221), 11,
      anon_sym_DQUOTE,
      anon_sym_RBRACE_GT,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [3155] = 4,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(227), 2,
      anon_sym_CALLDICT,
      anon_sym_INLINECALLDICT,
    ACTIONS(225), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(221), 11,
      anon_sym_DQUOTE,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_RBRACE_GTDO_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [3182] = 4,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(231), 1,
      anon_sym_ELSE_LT_LBRACE,
    ACTIONS(233), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(229), 11,
      anon_sym_DQUOTE,
      anon_sym_RBRACE_GT,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [3208] = 4,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(235), 1,
      anon_sym_ELSE_LT_LBRACE,
    ACTIONS(233), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(229), 11,
      anon_sym_DQUOTE,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_RBRACE_GTDO_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [3234] = 4,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(239), 1,
      anon_sym_ELSE_LT_LBRACE,
    ACTIONS(241), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(237), 11,
      anon_sym_DQUOTE,
      anon_sym_RBRACE_GT,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [3260] = 4,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(243), 1,
      anon_sym_ELSE_LT_LBRACE,
    ACTIONS(241), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(237), 11,
      anon_sym_DQUOTE,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_RBRACE_GTDO_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [3286] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(247), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(245), 11,
      anon_sym_DQUOTE,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_RBRACE_GTDO_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [3309] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(251), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(249), 11,
      anon_sym_DQUOTE,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_RBRACE_GTDO_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [3332] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(225), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(221), 11,
      anon_sym_DQUOTE,
      anon_sym_RBRACE_GT,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [3355] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(255), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(253), 11,
      anon_sym_DQUOTE,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_RBRACE_GTDO_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [3378] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(255), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(253), 11,
      anon_sym_DQUOTE,
      anon_sym_RBRACE_GT,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [3401] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(225), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(221), 11,
      anon_sym_DQUOTE,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_RBRACE_GTDO_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [3424] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(259), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(257), 11,
      anon_sym_DQUOTE,
      anon_sym_RBRACE_GT,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [3447] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(263), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(261), 11,
      anon_sym_DQUOTE,
      anon_sym_RBRACE_GT,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [3470] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(267), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(265), 11,
      anon_sym_DQUOTE,
      anon_sym_RBRACE_GT,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [3493] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(271), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(269), 11,
      anon_sym_DQUOTE,
      anon_sym_RBRACE_GT,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [3516] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(259), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(257), 11,
      anon_sym_DQUOTE,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_RBRACE_GTDO_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [3539] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(263), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(261), 11,
      anon_sym_DQUOTE,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_RBRACE_GTDO_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [3562] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(275), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(273), 11,
      anon_sym_DQUOTE,
      anon_sym_RBRACE_GT,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [3585] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(267), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(265), 11,
      anon_sym_DQUOTE,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_RBRACE_GTDO_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [3608] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(279), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(277), 11,
      anon_sym_DQUOTE,
      anon_sym_RBRACE_GT,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [3631] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(283), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(281), 11,
      anon_sym_DQUOTE,
      anon_sym_RBRACE_GT,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [3654] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(287), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(285), 11,
      anon_sym_DQUOTE,
      anon_sym_RBRACE_GT,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [3677] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(271), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(269), 11,
      anon_sym_DQUOTE,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_RBRACE_GTDO_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [3700] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(291), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(289), 11,
      anon_sym_DQUOTE,
      anon_sym_RBRACE_GT,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [3723] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(295), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(293), 11,
      anon_sym_DQUOTE,
      anon_sym_RBRACE_GT,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [3746] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(275), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(273), 11,
      anon_sym_DQUOTE,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_RBRACE_GTDO_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [3769] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(299), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(297), 11,
      anon_sym_DQUOTE,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_RBRACE_GTDO_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [3792] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(303), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(301), 11,
      anon_sym_DQUOTE,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_RBRACE_GTDO_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [3815] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(307), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(305), 11,
      anon_sym_DQUOTE,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_RBRACE_GTDO_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [3838] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(311), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(309), 11,
      anon_sym_DQUOTE,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_RBRACE_GTDO_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [3861] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(315), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(313), 11,
      anon_sym_DQUOTE,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_RBRACE_GTDO_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [3884] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(319), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(317), 11,
      anon_sym_DQUOTE,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_RBRACE_GTDO_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [3907] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(279), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(277), 11,
      anon_sym_DQUOTE,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_RBRACE_GTDO_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [3930] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(299), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(297), 11,
      anon_sym_DQUOTE,
      anon_sym_RBRACE_GT,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [3953] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(247), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(245), 11,
      anon_sym_DQUOTE,
      anon_sym_RBRACE_GT,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [3976] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(303), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(301), 11,
      anon_sym_DQUOTE,
      anon_sym_RBRACE_GT,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [3999] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(295), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(293), 11,
      anon_sym_DQUOTE,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_RBRACE_GTDO_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [4022] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(251), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(249), 11,
      anon_sym_DQUOTE,
      anon_sym_RBRACE_GT,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [4045] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(319), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(317), 11,
      anon_sym_DQUOTE,
      anon_sym_RBRACE_GT,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [4068] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(291), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(289), 11,
      anon_sym_DQUOTE,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_RBRACE_GTDO_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [4091] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(287), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(285), 11,
      anon_sym_DQUOTE,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_RBRACE_GTDO_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [4114] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(315), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(313), 11,
      anon_sym_DQUOTE,
      anon_sym_RBRACE_GT,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [4137] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(311), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(309), 11,
      anon_sym_DQUOTE,
      anon_sym_RBRACE_GT,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [4160] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(307), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(305), 11,
      anon_sym_DQUOTE,
      anon_sym_RBRACE_GT,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [4183] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(283), 4,
      sym_identifier,
      anon_sym_DASH,
      aux_sym_number_token1,
      anon_sym_s,
    ACTIONS(281), 11,
      anon_sym_DQUOTE,
      anon_sym_IF_COLON_LT_LBRACE,
      anon_sym_IFJMP_COLON_LT_LBRACE,
      anon_sym_WHILE_COLON_LT_LBRACE,
      anon_sym_RBRACE_GTDO_LT_LBRACE,
      anon_sym_REPEAT_COLON_LT_LBRACE,
      anon_sym_UNTIL_COLON_LT_LBRACE,
      anon_sym_b_LBRACE,
      anon_sym_x_LBRACE,
      anon_sym_B_LBRACE,
      sym_hex_literal,
  [4206] = 9,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(321), 1,
      anon_sym_END_GTc,
    ACTIONS(323), 1,
      aux_sym_declaration_token1,
    ACTIONS(325), 1,
      anon_sym_DECLGLOBVAR,
    ACTIONS(327), 1,
      sym_identifier,
    STATE(96), 2,
      sym_definition,
      aux_sym_program_repeat2,
    STATE(99), 2,
      sym_declaration,
      aux_sym_program_repeat1,
    STATE(102), 2,
      sym_global_var,
      aux_sym_program_repeat3,
    STATE(113), 4,
      sym_proc_definition,
      sym_proc_inline_definition,
      sym_proc_ref_definition,
      sym_method_definition,
  [4240] = 9,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(323), 1,
      aux_sym_declaration_token1,
    ACTIONS(325), 1,
      anon_sym_DECLGLOBVAR,
    ACTIONS(327), 1,
      sym_identifier,
    ACTIONS(329), 1,
      anon_sym_END_GTc,
    STATE(94), 2,
      sym_declaration,
      aux_sym_program_repeat1,
    STATE(97), 2,
      sym_definition,
      aux_sym_program_repeat2,
    STATE(106), 2,
      sym_global_var,
      aux_sym_program_repeat3,
    STATE(113), 4,
      sym_proc_definition,
      sym_proc_inline_definition,
      sym_proc_ref_definition,
      sym_method_definition,
  [4274] = 7,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(325), 1,
      anon_sym_DECLGLOBVAR,
    ACTIONS(331), 1,
      anon_sym_END_GTc,
    ACTIONS(333), 1,
      sym_identifier,
    STATE(98), 2,
      sym_definition,
      aux_sym_program_repeat2,
    STATE(103), 2,
      sym_global_var,
      aux_sym_program_repeat3,
    STATE(113), 4,
      sym_proc_definition,
      sym_proc_inline_definition,
      sym_proc_ref_definition,
      sym_method_definition,
  [4301] = 7,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(321), 1,
      anon_sym_END_GTc,
    ACTIONS(325), 1,
      anon_sym_DECLGLOBVAR,
    ACTIONS(333), 1,
      sym_identifier,
    STATE(98), 2,
      sym_definition,
      aux_sym_program_repeat2,
    STATE(102), 2,
      sym_global_var,
      aux_sym_program_repeat3,
    STATE(113), 4,
      sym_proc_definition,
      sym_proc_inline_definition,
      sym_proc_ref_definition,
      sym_method_definition,
  [4328] = 6,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(335), 1,
      anon_sym_END_GTc,
    ACTIONS(337), 1,
      anon_sym_DECLGLOBVAR,
    ACTIONS(339), 1,
      sym_identifier,
    STATE(98), 2,
      sym_definition,
      aux_sym_program_repeat2,
    STATE(113), 4,
      sym_proc_definition,
      sym_proc_inline_definition,
      sym_proc_ref_definition,
      sym_method_definition,
  [4351] = 6,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(342), 1,
      anon_sym_END_GTc,
    ACTIONS(344), 1,
      aux_sym_declaration_token1,
    ACTIONS(347), 1,
      anon_sym_DECLGLOBVAR,
    ACTIONS(349), 1,
      sym_identifier,
    STATE(99), 2,
      sym_declaration,
      aux_sym_program_repeat1,
  [4371] = 6,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(354), 1,
      anon_sym_PROC_COLON_LT_LBRACE,
    ACTIONS(356), 1,
      anon_sym_PROCINLINE_COLON_LT_LBRACE,
    ACTIONS(358), 1,
      anon_sym_PROCREF_COLON_LT_LBRACE,
    ACTIONS(360), 1,
      anon_sym_METHOD_COLON_LT_LBRACE,
    ACTIONS(352), 2,
      anon_sym_DECLPROC,
      anon_sym_DECLGLOBVAR,
  [4391] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(362), 2,
      anon_sym_END_GTc,
      aux_sym_declaration_token1,
    ACTIONS(364), 2,
      anon_sym_DECLGLOBVAR,
      sym_identifier,
  [4403] = 4,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(331), 1,
      anon_sym_END_GTc,
    ACTIONS(366), 1,
      anon_sym_DECLGLOBVAR,
    STATE(104), 2,
      sym_global_var,
      aux_sym_program_repeat3,
  [4417] = 4,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(366), 1,
      anon_sym_DECLGLOBVAR,
    ACTIONS(368), 1,
      anon_sym_END_GTc,
    STATE(104), 2,
      sym_global_var,
      aux_sym_program_repeat3,
  [4431] = 4,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(370), 1,
      anon_sym_END_GTc,
    ACTIONS(372), 1,
      anon_sym_DECLGLOBVAR,
    STATE(104), 2,
      sym_global_var,
      aux_sym_program_repeat3,
  [4445] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(375), 2,
      anon_sym_END_GTc,
      aux_sym_declaration_token1,
    ACTIONS(377), 2,
      anon_sym_DECLGLOBVAR,
      sym_identifier,
  [4457] = 4,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(321), 1,
      anon_sym_END_GTc,
    ACTIONS(366), 1,
      anon_sym_DECLGLOBVAR,
    STATE(104), 2,
      sym_global_var,
      aux_sym_program_repeat3,
  [4471] = 5,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(354), 1,
      anon_sym_PROC_COLON_LT_LBRACE,
    ACTIONS(356), 1,
      anon_sym_PROCINLINE_COLON_LT_LBRACE,
    ACTIONS(358), 1,
      anon_sym_PROCREF_COLON_LT_LBRACE,
    ACTIONS(360), 1,
      anon_sym_METHOD_COLON_LT_LBRACE,
  [4487] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(379), 1,
      anon_sym_END_GTc,
    ACTIONS(381), 2,
      anon_sym_DECLGLOBVAR,
      sym_identifier,
  [4498] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(383), 1,
      anon_sym_END_GTc,
    ACTIONS(385), 2,
      anon_sym_DECLGLOBVAR,
      sym_identifier,
  [4509] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(387), 1,
      anon_sym_END_GTc,
    ACTIONS(389), 2,
      anon_sym_DECLGLOBVAR,
      sym_identifier,
  [4520] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(391), 1,
      anon_sym_END_GTc,
    ACTIONS(393), 2,
      anon_sym_DECLGLOBVAR,
      sym_identifier,
  [4531] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(395), 1,
      anon_sym_END_GTc,
    ACTIONS(397), 2,
      anon_sym_DECLGLOBVAR,
      sym_identifier,
  [4542] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(399), 1,
      anon_sym_END_GTc,
    ACTIONS(401), 2,
      anon_sym_DECLGLOBVAR,
      sym_identifier,
  [4553] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(403), 1,
      anon_sym_END_GTc,
    ACTIONS(405), 2,
      anon_sym_DECLGLOBVAR,
      sym_identifier,
  [4564] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(407), 1,
      anon_sym_END_GTc,
    ACTIONS(409), 2,
      anon_sym_DECLGLOBVAR,
      sym_identifier,
  [4575] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(411), 1,
      anon_sym_END_GTc,
    ACTIONS(413), 2,
      anon_sym_DECLGLOBVAR,
      sym_identifier,
  [4586] = 2,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(352), 2,
      anon_sym_DECLPROC,
      anon_sym_DECLGLOBVAR,
  [4594] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(415), 1,
      anon_sym_LPAREN,
    ACTIONS(417), 1,
      aux_sym_stack_index_token1,
  [4604] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(417), 1,
      aux_sym_stack_index_token1,
    ACTIONS(419), 1,
      anon_sym_LPAREN,
  [4614] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(421), 1,
      anon_sym_s,
    STATE(142), 1,
      sym_stack_index,
  [4624] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(7), 1,
      anon_sym_PROGRAM_LBRACE,
    STATE(136), 1,
      sym_program,
  [4634] = 3,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(421), 1,
      anon_sym_s,
    STATE(126), 1,
      sym_stack_index,
  [4644] = 2,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(423), 2,
      anon_sym_END_GTc,
      anon_sym_DECLGLOBVAR,
  [4652] = 2,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(425), 1,
      anon_sym_include,
  [4659] = 2,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(427), 1,
      anon_sym_RBRACE,
  [4666] = 2,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(429), 1,
      sym_identifier,
  [4673] = 2,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(431), 1,
      aux_sym_stack_index_token1,
  [4680] = 2,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(433), 1,
      anon_sym_s,
  [4687] = 2,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(435), 1,
      aux_sym_number_token1,
  [4694] = 2,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(437), 1,
      anon_sym_RBRACE,
  [4701] = 2,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(439), 1,
      anon_sym_DQUOTE,
  [4708] = 2,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(441), 1,
      ts_builtin_sym_end,
  [4715] = 2,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(443), 1,
      sym_identifier,
  [4722] = 2,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(445), 1,
      sym_identifier,
  [4729] = 2,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(447), 1,
      anon_sym_DQUOTE,
  [4736] = 2,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(449), 1,
      ts_builtin_sym_end,
  [4743] = 2,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(451), 1,
      sym_identifier,
  [4750] = 2,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(453), 1,
      ts_builtin_sym_end,
  [4757] = 2,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(455), 1,
      ts_builtin_sym_end,
  [4764] = 2,
    ACTIONS(457), 1,
      aux_sym_include_directive_token1,
    ACTIONS(459), 1,
      sym_comment,
  [4771] = 2,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(461), 1,
      aux_sym_slice_literal_token2,
  [4778] = 2,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(463), 1,
      sym_identifier,
  [4785] = 2,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(461), 1,
      aux_sym_slice_literal_token1,
  [4792] = 2,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(465), 1,
      sym_identifier,
  [4799] = 2,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(467), 1,
      anon_sym_DECLMETHOD,
  [4806] = 2,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(469), 1,
      anon_sym_RPAREN,
  [4813] = 2,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(471), 1,
      ts_builtin_sym_end,
  [4820] = 2,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(473), 1,
      anon_sym_DQUOTE,
  [4827] = 2,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(475), 1,
      ts_builtin_sym_end,
  [4834] = 2,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(433), 1,
      sym_identifier,
  [4841] = 2,
    ACTIONS(459), 1,
      sym_comment,
    ACTIONS(477), 1,
      aux_sym_string_token1,
  [4848] = 2,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(479), 1,
      ts_builtin_sym_end,
  [4855] = 2,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(481), 1,
      aux_sym_slice_literal_token1,
  [4862] = 2,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(481), 1,
      aux_sym_slice_literal_token2,
  [4869] = 2,
    ACTIONS(459), 1,
      sym_comment,
    ACTIONS(483), 1,
      aux_sym_string_token1,
  [4876] = 2,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(485), 1,
      anon_sym_RPAREN,
  [4883] = 2,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(487), 1,
      aux_sym_number_token1,
  [4890] = 2,
    ACTIONS(3), 1,
      sym_comment,
    ACTIONS(489), 1,
      anon_sym_PROGRAM_LBRACE,
};

static const uint32_t ts_small_parse_table_map[] = {
  [SMALL_STATE(2)] = 0,
  [SMALL_STATE(3)] = 68,
  [SMALL_STATE(4)] = 136,
  [SMALL_STATE(5)] = 204,
  [SMALL_STATE(6)] = 272,
  [SMALL_STATE(7)] = 340,
  [SMALL_STATE(8)] = 408,
  [SMALL_STATE(9)] = 476,
  [SMALL_STATE(10)] = 544,
  [SMALL_STATE(11)] = 612,
  [SMALL_STATE(12)] = 680,
  [SMALL_STATE(13)] = 748,
  [SMALL_STATE(14)] = 816,
  [SMALL_STATE(15)] = 884,
  [SMALL_STATE(16)] = 952,
  [SMALL_STATE(17)] = 1020,
  [SMALL_STATE(18)] = 1088,
  [SMALL_STATE(19)] = 1156,
  [SMALL_STATE(20)] = 1224,
  [SMALL_STATE(21)] = 1292,
  [SMALL_STATE(22)] = 1360,
  [SMALL_STATE(23)] = 1428,
  [SMALL_STATE(24)] = 1496,
  [SMALL_STATE(25)] = 1564,
  [SMALL_STATE(26)] = 1632,
  [SMALL_STATE(27)] = 1700,
  [SMALL_STATE(28)] = 1768,
  [SMALL_STATE(29)] = 1836,
  [SMALL_STATE(30)] = 1904,
  [SMALL_STATE(31)] = 1972,
  [SMALL_STATE(32)] = 2040,
  [SMALL_STATE(33)] = 2108,
  [SMALL_STATE(34)] = 2176,
  [SMALL_STATE(35)] = 2244,
  [SMALL_STATE(36)] = 2312,
  [SMALL_STATE(37)] = 2380,
  [SMALL_STATE(38)] = 2448,
  [SMALL_STATE(39)] = 2516,
  [SMALL_STATE(40)] = 2584,
  [SMALL_STATE(41)] = 2652,
  [SMALL_STATE(42)] = 2720,
  [SMALL_STATE(43)] = 2788,
  [SMALL_STATE(44)] = 2856,
  [SMALL_STATE(45)] = 2924,
  [SMALL_STATE(46)] = 2992,
  [SMALL_STATE(47)] = 3060,
  [SMALL_STATE(48)] = 3128,
  [SMALL_STATE(49)] = 3155,
  [SMALL_STATE(50)] = 3182,
  [SMALL_STATE(51)] = 3208,
  [SMALL_STATE(52)] = 3234,
  [SMALL_STATE(53)] = 3260,
  [SMALL_STATE(54)] = 3286,
  [SMALL_STATE(55)] = 3309,
  [SMALL_STATE(56)] = 3332,
  [SMALL_STATE(57)] = 3355,
  [SMALL_STATE(58)] = 3378,
  [SMALL_STATE(59)] = 3401,
  [SMALL_STATE(60)] = 3424,
  [SMALL_STATE(61)] = 3447,
  [SMALL_STATE(62)] = 3470,
  [SMALL_STATE(63)] = 3493,
  [SMALL_STATE(64)] = 3516,
  [SMALL_STATE(65)] = 3539,
  [SMALL_STATE(66)] = 3562,
  [SMALL_STATE(67)] = 3585,
  [SMALL_STATE(68)] = 3608,
  [SMALL_STATE(69)] = 3631,
  [SMALL_STATE(70)] = 3654,
  [SMALL_STATE(71)] = 3677,
  [SMALL_STATE(72)] = 3700,
  [SMALL_STATE(73)] = 3723,
  [SMALL_STATE(74)] = 3746,
  [SMALL_STATE(75)] = 3769,
  [SMALL_STATE(76)] = 3792,
  [SMALL_STATE(77)] = 3815,
  [SMALL_STATE(78)] = 3838,
  [SMALL_STATE(79)] = 3861,
  [SMALL_STATE(80)] = 3884,
  [SMALL_STATE(81)] = 3907,
  [SMALL_STATE(82)] = 3930,
  [SMALL_STATE(83)] = 3953,
  [SMALL_STATE(84)] = 3976,
  [SMALL_STATE(85)] = 3999,
  [SMALL_STATE(86)] = 4022,
  [SMALL_STATE(87)] = 4045,
  [SMALL_STATE(88)] = 4068,
  [SMALL_STATE(89)] = 4091,
  [SMALL_STATE(90)] = 4114,
  [SMALL_STATE(91)] = 4137,
  [SMALL_STATE(92)] = 4160,
  [SMALL_STATE(93)] = 4183,
  [SMALL_STATE(94)] = 4206,
  [SMALL_STATE(95)] = 4240,
  [SMALL_STATE(96)] = 4274,
  [SMALL_STATE(97)] = 4301,
  [SMALL_STATE(98)] = 4328,
  [SMALL_STATE(99)] = 4351,
  [SMALL_STATE(100)] = 4371,
  [SMALL_STATE(101)] = 4391,
  [SMALL_STATE(102)] = 4403,
  [SMALL_STATE(103)] = 4417,
  [SMALL_STATE(104)] = 4431,
  [SMALL_STATE(105)] = 4445,
  [SMALL_STATE(106)] = 4457,
  [SMALL_STATE(107)] = 4471,
  [SMALL_STATE(108)] = 4487,
  [SMALL_STATE(109)] = 4498,
  [SMALL_STATE(110)] = 4509,
  [SMALL_STATE(111)] = 4520,
  [SMALL_STATE(112)] = 4531,
  [SMALL_STATE(113)] = 4542,
  [SMALL_STATE(114)] = 4553,
  [SMALL_STATE(115)] = 4564,
  [SMALL_STATE(116)] = 4575,
  [SMALL_STATE(117)] = 4586,
  [SMALL_STATE(118)] = 4594,
  [SMALL_STATE(119)] = 4604,
  [SMALL_STATE(120)] = 4614,
  [SMALL_STATE(121)] = 4624,
  [SMALL_STATE(122)] = 4634,
  [SMALL_STATE(123)] = 4644,
  [SMALL_STATE(124)] = 4652,
  [SMALL_STATE(125)] = 4659,
  [SMALL_STATE(126)] = 4666,
  [SMALL_STATE(127)] = 4673,
  [SMALL_STATE(128)] = 4680,
  [SMALL_STATE(129)] = 4687,
  [SMALL_STATE(130)] = 4694,
  [SMALL_STATE(131)] = 4701,
  [SMALL_STATE(132)] = 4708,
  [SMALL_STATE(133)] = 4715,
  [SMALL_STATE(134)] = 4722,
  [SMALL_STATE(135)] = 4729,
  [SMALL_STATE(136)] = 4736,
  [SMALL_STATE(137)] = 4743,
  [SMALL_STATE(138)] = 4750,
  [SMALL_STATE(139)] = 4757,
  [SMALL_STATE(140)] = 4764,
  [SMALL_STATE(141)] = 4771,
  [SMALL_STATE(142)] = 4778,
  [SMALL_STATE(143)] = 4785,
  [SMALL_STATE(144)] = 4792,
  [SMALL_STATE(145)] = 4799,
  [SMALL_STATE(146)] = 4806,
  [SMALL_STATE(147)] = 4813,
  [SMALL_STATE(148)] = 4820,
  [SMALL_STATE(149)] = 4827,
  [SMALL_STATE(150)] = 4834,
  [SMALL_STATE(151)] = 4841,
  [SMALL_STATE(152)] = 4848,
  [SMALL_STATE(153)] = 4855,
  [SMALL_STATE(154)] = 4862,
  [SMALL_STATE(155)] = 4869,
  [SMALL_STATE(156)] = 4876,
  [SMALL_STATE(157)] = 4883,
  [SMALL_STATE(158)] = 4890,
};

static const TSParseActionEntry ts_parse_actions[] = {
  [0] = {.entry = {.count = 0, .reusable = false}},
  [1] = {.entry = {.count = 1, .reusable = false}}, RECOVER(),
  [3] = {.entry = {.count = 1, .reusable = true}}, SHIFT_EXTRA(),
  [5] = {.entry = {.count = 1, .reusable = true}}, SHIFT(140),
  [7] = {.entry = {.count = 1, .reusable = true}}, SHIFT(95),
  [9] = {.entry = {.count = 2, .reusable = true}}, REDUCE(aux_sym_proc_definition_repeat1, 2, 0, 0), SHIFT_REPEAT(151),
  [12] = {.entry = {.count = 2, .reusable = true}}, REDUCE(aux_sym_proc_definition_repeat1, 2, 0, 0), SHIFT_REPEAT(19),
  [15] = {.entry = {.count = 2, .reusable = true}}, REDUCE(aux_sym_proc_definition_repeat1, 2, 0, 0), SHIFT_REPEAT(18),
  [18] = {.entry = {.count = 2, .reusable = true}}, REDUCE(aux_sym_proc_definition_repeat1, 2, 0, 0), SHIFT_REPEAT(26),
  [21] = {.entry = {.count = 1, .reusable = true}}, REDUCE(aux_sym_proc_definition_repeat1, 2, 0, 0),
  [23] = {.entry = {.count = 2, .reusable = true}}, REDUCE(aux_sym_proc_definition_repeat1, 2, 0, 0), SHIFT_REPEAT(17),
  [26] = {.entry = {.count = 2, .reusable = true}}, REDUCE(aux_sym_proc_definition_repeat1, 2, 0, 0), SHIFT_REPEAT(16),
  [29] = {.entry = {.count = 2, .reusable = true}}, REDUCE(aux_sym_proc_definition_repeat1, 2, 0, 0), SHIFT_REPEAT(153),
  [32] = {.entry = {.count = 2, .reusable = true}}, REDUCE(aux_sym_proc_definition_repeat1, 2, 0, 0), SHIFT_REPEAT(154),
  [35] = {.entry = {.count = 2, .reusable = true}}, REDUCE(aux_sym_proc_definition_repeat1, 2, 0, 0), SHIFT_REPEAT(59),
  [38] = {.entry = {.count = 2, .reusable = false}}, REDUCE(aux_sym_proc_definition_repeat1, 2, 0, 0), SHIFT_REPEAT(49),
  [41] = {.entry = {.count = 2, .reusable = false}}, REDUCE(aux_sym_proc_definition_repeat1, 2, 0, 0), SHIFT_REPEAT(134),
  [44] = {.entry = {.count = 2, .reusable = false}}, REDUCE(aux_sym_proc_definition_repeat1, 2, 0, 0), SHIFT_REPEAT(57),
  [47] = {.entry = {.count = 2, .reusable = false}}, REDUCE(aux_sym_proc_definition_repeat1, 2, 0, 0), SHIFT_REPEAT(118),
  [50] = {.entry = {.count = 1, .reusable = true}}, SHIFT(151),
  [52] = {.entry = {.count = 1, .reusable = true}}, SHIFT(19),
  [54] = {.entry = {.count = 1, .reusable = true}}, SHIFT(18),
  [56] = {.entry = {.count = 1, .reusable = true}}, SHIFT(26),
  [58] = {.entry = {.count = 1, .reusable = true}}, SHIFT(33),
  [60] = {.entry = {.count = 1, .reusable = true}}, SHIFT(17),
  [62] = {.entry = {.count = 1, .reusable = true}}, SHIFT(16),
  [64] = {.entry = {.count = 1, .reusable = true}}, SHIFT(153),
  [66] = {.entry = {.count = 1, .reusable = true}}, SHIFT(154),
  [68] = {.entry = {.count = 1, .reusable = true}}, SHIFT(59),
  [70] = {.entry = {.count = 1, .reusable = false}}, SHIFT(49),
  [72] = {.entry = {.count = 1, .reusable = false}}, SHIFT(134),
  [74] = {.entry = {.count = 1, .reusable = false}}, SHIFT(57),
  [76] = {.entry = {.count = 1, .reusable = false}}, SHIFT(118),
  [78] = {.entry = {.count = 1, .reusable = true}}, SHIFT(155),
  [80] = {.entry = {.count = 1, .reusable = true}}, SHIFT(64),
  [82] = {.entry = {.count = 1, .reusable = true}}, SHIFT(36),
  [84] = {.entry = {.count = 1, .reusable = true}}, SHIFT(37),
  [86] = {.entry = {.count = 1, .reusable = true}}, SHIFT(38),
  [88] = {.entry = {.count = 1, .reusable = true}}, SHIFT(39),
  [90] = {.entry = {.count = 1, .reusable = true}}, SHIFT(40),
  [92] = {.entry = {.count = 1, .reusable = true}}, SHIFT(143),
  [94] = {.entry = {.count = 1, .reusable = true}}, SHIFT(141),
  [96] = {.entry = {.count = 1, .reusable = true}}, SHIFT(56),
  [98] = {.entry = {.count = 1, .reusable = false}}, SHIFT(48),
  [100] = {.entry = {.count = 1, .reusable = false}}, SHIFT(137),
  [102] = {.entry = {.count = 1, .reusable = false}}, SHIFT(58),
  [104] = {.entry = {.count = 1, .reusable = false}}, SHIFT(119),
  [106] = {.entry = {.count = 1, .reusable = true}}, SHIFT(65),
  [108] = {.entry = {.count = 1, .reusable = true}}, SHIFT(67),
  [110] = {.entry = {.count = 1, .reusable = true}}, SHIFT(74),
  [112] = {.entry = {.count = 1, .reusable = true}}, SHIFT(75),
  [114] = {.entry = {.count = 1, .reusable = true}}, SHIFT(78),
  [116] = {.entry = {.count = 1, .reusable = true}}, SHIFT(79),
  [118] = {.entry = {.count = 1, .reusable = true}}, SHIFT(80),
  [120] = {.entry = {.count = 1, .reusable = true}}, SHIFT(110),
  [122] = {.entry = {.count = 1, .reusable = true}}, SHIFT(53),
  [124] = {.entry = {.count = 1, .reusable = true}}, SHIFT(89),
  [126] = {.entry = {.count = 1, .reusable = true}}, SHIFT(93),
  [128] = {.entry = {.count = 1, .reusable = true}}, SHIFT(81),
  [130] = {.entry = {.count = 1, .reusable = true}}, SHIFT(51),
  [132] = {.entry = {.count = 1, .reusable = true}}, SHIFT(109),
  [134] = {.entry = {.count = 1, .reusable = true}}, SHIFT(114),
  [136] = {.entry = {.count = 1, .reusable = true}}, SHIFT(115),
  [138] = {.entry = {.count = 1, .reusable = true}}, SHIFT(116),
  [140] = {.entry = {.count = 2, .reusable = true}}, REDUCE(aux_sym_proc_definition_repeat1, 2, 0, 0), SHIFT_REPEAT(155),
  [143] = {.entry = {.count = 2, .reusable = true}}, REDUCE(aux_sym_proc_definition_repeat1, 2, 0, 0), SHIFT_REPEAT(36),
  [146] = {.entry = {.count = 2, .reusable = true}}, REDUCE(aux_sym_proc_definition_repeat1, 2, 0, 0), SHIFT_REPEAT(37),
  [149] = {.entry = {.count = 2, .reusable = true}}, REDUCE(aux_sym_proc_definition_repeat1, 2, 0, 0), SHIFT_REPEAT(38),
  [152] = {.entry = {.count = 2, .reusable = true}}, REDUCE(aux_sym_proc_definition_repeat1, 2, 0, 0), SHIFT_REPEAT(39),
  [155] = {.entry = {.count = 2, .reusable = true}}, REDUCE(aux_sym_proc_definition_repeat1, 2, 0, 0), SHIFT_REPEAT(40),
  [158] = {.entry = {.count = 2, .reusable = true}}, REDUCE(aux_sym_proc_definition_repeat1, 2, 0, 0), SHIFT_REPEAT(143),
  [161] = {.entry = {.count = 2, .reusable = true}}, REDUCE(aux_sym_proc_definition_repeat1, 2, 0, 0), SHIFT_REPEAT(141),
  [164] = {.entry = {.count = 2, .reusable = true}}, REDUCE(aux_sym_proc_definition_repeat1, 2, 0, 0), SHIFT_REPEAT(56),
  [167] = {.entry = {.count = 2, .reusable = false}}, REDUCE(aux_sym_proc_definition_repeat1, 2, 0, 0), SHIFT_REPEAT(48),
  [170] = {.entry = {.count = 2, .reusable = false}}, REDUCE(aux_sym_proc_definition_repeat1, 2, 0, 0), SHIFT_REPEAT(137),
  [173] = {.entry = {.count = 2, .reusable = false}}, REDUCE(aux_sym_proc_definition_repeat1, 2, 0, 0), SHIFT_REPEAT(58),
  [176] = {.entry = {.count = 2, .reusable = false}}, REDUCE(aux_sym_proc_definition_repeat1, 2, 0, 0), SHIFT_REPEAT(119),
  [179] = {.entry = {.count = 1, .reusable = true}}, SHIFT(86),
  [181] = {.entry = {.count = 1, .reusable = true}}, SHIFT(13),
  [183] = {.entry = {.count = 1, .reusable = true}}, SHIFT(8),
  [185] = {.entry = {.count = 1, .reusable = true}}, SHIFT(55),
  [187] = {.entry = {.count = 1, .reusable = true}}, SHIFT(60),
  [189] = {.entry = {.count = 1, .reusable = true}}, SHIFT(61),
  [191] = {.entry = {.count = 1, .reusable = true}}, SHIFT(62),
  [193] = {.entry = {.count = 1, .reusable = true}}, SHIFT(66),
  [195] = {.entry = {.count = 1, .reusable = true}}, SHIFT(111),
  [197] = {.entry = {.count = 1, .reusable = true}}, SHIFT(50),
  [199] = {.entry = {.count = 1, .reusable = true}}, SHIFT(68),
  [201] = {.entry = {.count = 1, .reusable = true}}, SHIFT(43),
  [203] = {.entry = {.count = 1, .reusable = true}}, SHIFT(69),
  [205] = {.entry = {.count = 1, .reusable = true}}, SHIFT(70),
  [207] = {.entry = {.count = 1, .reusable = true}}, SHIFT(82),
  [209] = {.entry = {.count = 1, .reusable = true}}, SHIFT(108),
  [211] = {.entry = {.count = 1, .reusable = true}}, SHIFT(87),
  [213] = {.entry = {.count = 1, .reusable = true}}, SHIFT(52),
  [215] = {.entry = {.count = 1, .reusable = true}}, SHIFT(112),
  [217] = {.entry = {.count = 1, .reusable = true}}, SHIFT(91),
  [219] = {.entry = {.count = 1, .reusable = true}}, SHIFT(90),
  [221] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_instruction, 1, 0, 0),
  [223] = {.entry = {.count = 1, .reusable = false}}, SHIFT(72),
  [225] = {.entry = {.count = 1, .reusable = false}}, REDUCE(sym_instruction, 1, 0, 0),
  [227] = {.entry = {.count = 1, .reusable = false}}, SHIFT(88),
  [229] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_if_statement, 2, 0, 0),
  [231] = {.entry = {.count = 1, .reusable = true}}, SHIFT(41),
  [233] = {.entry = {.count = 1, .reusable = false}}, REDUCE(sym_if_statement, 2, 0, 0),
  [235] = {.entry = {.count = 1, .reusable = true}}, SHIFT(10),
  [237] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_if_statement, 3, 0, 0),
  [239] = {.entry = {.count = 1, .reusable = true}}, SHIFT(31),
  [241] = {.entry = {.count = 1, .reusable = false}}, REDUCE(sym_if_statement, 3, 0, 0),
  [243] = {.entry = {.count = 1, .reusable = true}}, SHIFT(6),
  [245] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_string, 3, 0, 0),
  [247] = {.entry = {.count = 1, .reusable = false}}, REDUCE(sym_string, 3, 0, 0),
  [249] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_ifjmp_statement, 3, 0, 0),
  [251] = {.entry = {.count = 1, .reusable = false}}, REDUCE(sym_ifjmp_statement, 3, 0, 0),
  [253] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_number, 1, 0, 0),
  [255] = {.entry = {.count = 1, .reusable = false}}, REDUCE(sym_number, 1, 0, 0),
  [257] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_if_statement, 6, 0, 0),
  [259] = {.entry = {.count = 1, .reusable = false}}, REDUCE(sym_if_statement, 6, 0, 0),
  [261] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_while_statement, 5, 0, 0),
  [263] = {.entry = {.count = 1, .reusable = false}}, REDUCE(sym_while_statement, 5, 0, 0),
  [265] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_if_statement, 5, 0, 0),
  [267] = {.entry = {.count = 1, .reusable = false}}, REDUCE(sym_if_statement, 5, 0, 0),
  [269] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_stack_ref, 4, 0, 0),
  [271] = {.entry = {.count = 1, .reusable = false}}, REDUCE(sym_stack_ref, 4, 0, 0),
  [273] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_while_statement, 4, 0, 0),
  [275] = {.entry = {.count = 1, .reusable = false}}, REDUCE(sym_while_statement, 4, 0, 0),
  [277] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_ifjmp_statement, 2, 0, 0),
  [279] = {.entry = {.count = 1, .reusable = false}}, REDUCE(sym_ifjmp_statement, 2, 0, 0),
  [281] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_repeat_statement, 2, 0, 0),
  [283] = {.entry = {.count = 1, .reusable = false}}, REDUCE(sym_repeat_statement, 2, 0, 0),
  [285] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_until_statement, 2, 0, 0),
  [287] = {.entry = {.count = 1, .reusable = false}}, REDUCE(sym_until_statement, 2, 0, 0),
  [289] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_proc_call, 2, 0, 0),
  [291] = {.entry = {.count = 1, .reusable = false}}, REDUCE(sym_proc_call, 2, 0, 0),
  [293] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_negative_identifier, 2, 0, 0),
  [295] = {.entry = {.count = 1, .reusable = false}}, REDUCE(sym_negative_identifier, 2, 0, 0),
  [297] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_if_statement, 4, 0, 0),
  [299] = {.entry = {.count = 1, .reusable = false}}, REDUCE(sym_if_statement, 4, 0, 0),
  [301] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_stack_op, 3, 0, 0),
  [303] = {.entry = {.count = 1, .reusable = false}}, REDUCE(sym_stack_op, 3, 0, 0),
  [305] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_slice_literal, 3, 0, 0),
  [307] = {.entry = {.count = 1, .reusable = false}}, REDUCE(sym_slice_literal, 3, 0, 0),
  [309] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_until_statement, 3, 0, 0),
  [311] = {.entry = {.count = 1, .reusable = false}}, REDUCE(sym_until_statement, 3, 0, 0),
  [313] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_repeat_statement, 3, 0, 0),
  [315] = {.entry = {.count = 1, .reusable = false}}, REDUCE(sym_repeat_statement, 3, 0, 0),
  [317] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_while_statement, 3, 0, 0),
  [319] = {.entry = {.count = 1, .reusable = false}}, REDUCE(sym_while_statement, 3, 0, 0),
  [321] = {.entry = {.count = 1, .reusable = true}}, SHIFT(139),
  [323] = {.entry = {.count = 1, .reusable = true}}, SHIFT(145),
  [325] = {.entry = {.count = 1, .reusable = false}}, SHIFT(144),
  [327] = {.entry = {.count = 1, .reusable = false}}, SHIFT(100),
  [329] = {.entry = {.count = 1, .reusable = true}}, SHIFT(147),
  [331] = {.entry = {.count = 1, .reusable = true}}, SHIFT(132),
  [333] = {.entry = {.count = 1, .reusable = false}}, SHIFT(107),
  [335] = {.entry = {.count = 1, .reusable = true}}, REDUCE(aux_sym_program_repeat2, 2, 0, 0),
  [337] = {.entry = {.count = 1, .reusable = false}}, REDUCE(aux_sym_program_repeat2, 2, 0, 0),
  [339] = {.entry = {.count = 2, .reusable = false}}, REDUCE(aux_sym_program_repeat2, 2, 0, 0), SHIFT_REPEAT(107),
  [342] = {.entry = {.count = 1, .reusable = true}}, REDUCE(aux_sym_program_repeat1, 2, 0, 0),
  [344] = {.entry = {.count = 2, .reusable = true}}, REDUCE(aux_sym_program_repeat1, 2, 0, 0), SHIFT_REPEAT(145),
  [347] = {.entry = {.count = 1, .reusable = false}}, REDUCE(aux_sym_program_repeat1, 2, 0, 0),
  [349] = {.entry = {.count = 2, .reusable = false}}, REDUCE(aux_sym_program_repeat1, 2, 0, 0), SHIFT_REPEAT(117),
  [352] = {.entry = {.count = 1, .reusable = true}}, SHIFT(105),
  [354] = {.entry = {.count = 1, .reusable = true}}, SHIFT(20),
  [356] = {.entry = {.count = 1, .reusable = true}}, SHIFT(21),
  [358] = {.entry = {.count = 1, .reusable = true}}, SHIFT(22),
  [360] = {.entry = {.count = 1, .reusable = true}}, SHIFT(23),
  [362] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_declaration, 3, 0, 3),
  [364] = {.entry = {.count = 1, .reusable = false}}, REDUCE(sym_declaration, 3, 0, 3),
  [366] = {.entry = {.count = 1, .reusable = true}}, SHIFT(144),
  [368] = {.entry = {.count = 1, .reusable = true}}, SHIFT(138),
  [370] = {.entry = {.count = 1, .reusable = true}}, REDUCE(aux_sym_program_repeat3, 2, 0, 0),
  [372] = {.entry = {.count = 2, .reusable = true}}, REDUCE(aux_sym_program_repeat3, 2, 0, 0), SHIFT_REPEAT(144),
  [375] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_declaration, 2, 0, 2),
  [377] = {.entry = {.count = 1, .reusable = false}}, REDUCE(sym_declaration, 2, 0, 2),
  [379] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_method_definition, 4, 0, 2),
  [381] = {.entry = {.count = 1, .reusable = false}}, REDUCE(sym_method_definition, 4, 0, 2),
  [383] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_proc_definition, 3, 0, 2),
  [385] = {.entry = {.count = 1, .reusable = false}}, REDUCE(sym_proc_definition, 3, 0, 2),
  [387] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_proc_ref_definition, 4, 0, 2),
  [389] = {.entry = {.count = 1, .reusable = false}}, REDUCE(sym_proc_ref_definition, 4, 0, 2),
  [391] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_proc_inline_definition, 4, 0, 2),
  [393] = {.entry = {.count = 1, .reusable = false}}, REDUCE(sym_proc_inline_definition, 4, 0, 2),
  [395] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_proc_definition, 4, 0, 2),
  [397] = {.entry = {.count = 1, .reusable = false}}, REDUCE(sym_proc_definition, 4, 0, 2),
  [399] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_definition, 1, 0, 0),
  [401] = {.entry = {.count = 1, .reusable = false}}, REDUCE(sym_definition, 1, 0, 0),
  [403] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_proc_inline_definition, 3, 0, 2),
  [405] = {.entry = {.count = 1, .reusable = false}}, REDUCE(sym_proc_inline_definition, 3, 0, 2),
  [407] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_proc_ref_definition, 3, 0, 2),
  [409] = {.entry = {.count = 1, .reusable = false}}, REDUCE(sym_proc_ref_definition, 3, 0, 2),
  [411] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_method_definition, 3, 0, 2),
  [413] = {.entry = {.count = 1, .reusable = false}}, REDUCE(sym_method_definition, 3, 0, 2),
  [415] = {.entry = {.count = 1, .reusable = true}}, SHIFT(157),
  [417] = {.entry = {.count = 1, .reusable = true}}, SHIFT(128),
  [419] = {.entry = {.count = 1, .reusable = true}}, SHIFT(129),
  [421] = {.entry = {.count = 1, .reusable = true}}, SHIFT(127),
  [423] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_global_var, 2, 0, 1),
  [425] = {.entry = {.count = 1, .reusable = true}}, SHIFT(158),
  [427] = {.entry = {.count = 1, .reusable = true}}, SHIFT(77),
  [429] = {.entry = {.count = 1, .reusable = true}}, SHIFT(84),
  [431] = {.entry = {.count = 1, .reusable = true}}, SHIFT(150),
  [433] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_stack_index, 2, 0, 0),
  [435] = {.entry = {.count = 1, .reusable = true}}, SHIFT(156),
  [437] = {.entry = {.count = 1, .reusable = true}}, SHIFT(92),
  [439] = {.entry = {.count = 1, .reusable = true}}, SHIFT(83),
  [441] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_program, 4, 0, 0),
  [443] = {.entry = {.count = 1, .reusable = true}}, SHIFT(101),
  [445] = {.entry = {.count = 1, .reusable = true}}, SHIFT(85),
  [447] = {.entry = {.count = 1, .reusable = true}}, SHIFT(54),
  [449] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_source_file, 2, 0, 0),
  [451] = {.entry = {.count = 1, .reusable = true}}, SHIFT(73),
  [453] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_program, 5, 0, 0),
  [455] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_program, 3, 0, 0),
  [457] = {.entry = {.count = 1, .reusable = false}}, SHIFT(148),
  [459] = {.entry = {.count = 1, .reusable = false}}, SHIFT_EXTRA(),
  [461] = {.entry = {.count = 1, .reusable = true}}, SHIFT(130),
  [463] = {.entry = {.count = 1, .reusable = true}}, SHIFT(76),
  [465] = {.entry = {.count = 1, .reusable = true}}, SHIFT(123),
  [467] = {.entry = {.count = 1, .reusable = true}}, SHIFT(133),
  [469] = {.entry = {.count = 1, .reusable = true}}, SHIFT(71),
  [471] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_program, 2, 0, 0),
  [473] = {.entry = {.count = 1, .reusable = true}}, SHIFT(124),
  [475] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_source_file, 1, 0, 0),
  [477] = {.entry = {.count = 1, .reusable = false}}, SHIFT(135),
  [479] = {.entry = {.count = 1, .reusable = true}},  ACCEPT_INPUT(),
  [481] = {.entry = {.count = 1, .reusable = true}}, SHIFT(125),
  [483] = {.entry = {.count = 1, .reusable = false}}, SHIFT(131),
  [485] = {.entry = {.count = 1, .reusable = true}}, SHIFT(63),
  [487] = {.entry = {.count = 1, .reusable = true}}, SHIFT(146),
  [489] = {.entry = {.count = 1, .reusable = true}}, REDUCE(sym_include_directive, 4, 0, 0),
};

#ifdef __cplusplus
extern "C" {
#endif
#ifdef TREE_SITTER_HIDE_SYMBOLS
#define TS_PUBLIC
#elif defined(_WIN32)
#define TS_PUBLIC __declspec(dllexport)
#else
#define TS_PUBLIC __attribute__((visibility("default")))
#endif

TS_PUBLIC const TSLanguage *tree_sitter_fift(void) {
  static const TSLanguage language = {
    .version = LANGUAGE_VERSION,
    .symbol_count = SYMBOL_COUNT,
    .alias_count = ALIAS_COUNT,
    .token_count = TOKEN_COUNT,
    .external_token_count = EXTERNAL_TOKEN_COUNT,
    .state_count = STATE_COUNT,
    .large_state_count = LARGE_STATE_COUNT,
    .production_id_count = PRODUCTION_ID_COUNT,
    .field_count = FIELD_COUNT,
    .max_alias_sequence_length = MAX_ALIAS_SEQUENCE_LENGTH,
    .parse_table = &ts_parse_table[0][0],
    .small_parse_table = ts_small_parse_table,
    .small_parse_table_map = ts_small_parse_table_map,
    .parse_actions = ts_parse_actions,
    .symbol_names = ts_symbol_names,
    .field_names = ts_field_names,
    .field_map_slices = ts_field_map_slices,
    .field_map_entries = ts_field_map_entries,
    .symbol_metadata = ts_symbol_metadata,
    .public_symbol_map = ts_symbol_map,
    .alias_map = ts_non_terminal_alias_map,
    .alias_sequences = &ts_alias_sequences[0][0],
    .lex_modes = ts_lex_modes,
    .lex_fn = ts_lex,
    .primary_state_ids = ts_primary_state_ids,
  };
  return &language;
}
#ifdef __cplusplus
}
#endif
