struct Whatever {
// <- keyword
//     ^ type
//              ^ punctuation.bracket

    a  : Int;
    // <- property
    // ^ punctuation.delimiter
    //   ^ type.builtin
    //      ^ punctuation.delimiter

    b  : String = "hello!";
    // <- property
    // ^ punctuation.delimiter
    //   ^ type.builtin
    //                    ^ punctuation.delimiter

    c  : Int as int32;
    // <- property
    // ^ punctuation.delimiter
    //   ^ type.builtin
    //       ^ keyword
    //          ^ type.builtin
    //               ^ punctuation.delimiter

    d  : Int as int256 = 10;
    // <- property
    // ^ punctuation.delimiter
    //   ^ type.builtin
    //       ^ keyword
    //          ^ type.builtin
    //                 ^ operator
    //                   ^ number
    //                     ^ punctuation.delimiter

}
// <- punctuation.bracket

fun TestStruct() {
    Whatever{a: 10, b: "hello!", c: 10, d: 10, };
    // <- constructor
    //      ^ punctuation.bracket
    //       ^ property
    //        ^ punctuation.delimiter
    //          ^ number
    //            ^ punctuation.delimiter
    //              ^ property
    //               ^ punctuation.delimiter
    //                 ^ string
    //                         ^ punctuation.delimiter
    //                           ^ property
    //                            ^ punctuation.delimiter
    //                              ^ number
    //                                ^ punctuation.delimiter
    //                                  ^ property
    //                                   ^ punctuation.delimiter
    //                                     ^ number
    //                                       ^ punctuation.delimiter
    //                                         ^ punctuation.bracket
    //                                          ^ punctuation.delimiter
}

struct Serialization {
    f1: Int as uint1;
    //         ^ type.builtin
    f2: Int as int1;
    //         ^ type.builtin
    f3: Int as uint10;
    //         ^ type.builtin
    f4: Int as int10;
    //         ^ type.builtin
    f5: Int as uint100;
    //         ^ type.builtin
    f6: Int as int100;
    //         ^ type.builtin
    f7: Int as uint200;
    //         ^ type.builtin
    f8: Int as int200;
    //         ^ type.builtin
    f9: Int as uint256;
    //         ^ type.builtin
    f10: Int as int257;
    //          ^ type.builtin
    f9wrong: Int as uint257;
    //              ^ variable
    f10wrong: Int as int258;
    //               ^ variable

    b32: Slice as bytes32;
    //            ^ type.builtin
    b64: Slice as bytes64;
    //            ^ type.builtin
    coin: Int as coins;
    //           ^ type.builtin
    payload: Slice as remaining;
    //                ^ type.builtin
}
