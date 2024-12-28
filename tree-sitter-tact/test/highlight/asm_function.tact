asm(-> 1_0_1) fun pushInt(): Int {
// <- keyword
// ^ punctuation.bracket
//  ^ operator
//     ^ number
//      ^ number
//          ^ punctuation.bracket
//            ^ keyword
//                ^ function
//                       ^ punctuation.bracket
//                        ^ punctuation.bracket
//                         ^ punctuation.delimiter
//                           ^ type.builtin
//                               ^ punctuation.bracket
    42 PUSHINT
}

asm fun pushIntWithNewWord(): Int {
    { 42 PUSHINT } : mostly-harmless
    mostly-harmless
}

asm(x -> 000) fun isIntAnInt(x: Int): Int {
// <- keyword
// ^ punctuation.bracket
//  ^ variable
//    ^ operator
//       ^ number
//          ^ punctuation.bracket
    <{
        TRY:<{
            0 PUSHINT ADD DROP -1 PUSHINT
        }>CATCH<{
            2DROP 0 PUSHINT
        }>
    }>CONT 1 1 CALLXARGS
}

asm fun moreInterestingExamples() {
  x{00} @Defop NOP
  { swap ({) over 2+ -roll swap (compile) (}) } : does
  B{123}
  b{0101}
}
