# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2025-02-18

### Improvements

- feat(inlay-hints): add parameters hints for `initOf Foo()` in https://github.com/tact-lang/tact-language-server/pull/216
- feat(inlay-hints): show ` as int257` hint inside map types as well in https://github.com/tact-lang/tact-language-server/pull/228
- feat(inlay-hints): don't show inlay hints in some cases in https://github.com/tact-lang/tact-language-server/pull/230
- feat(inlay-hints): show stack info for ASM instruction (disabled by default) in https://github.com/tact-lang/tact-language-server/pull/244
- feat(vscode): add Tact code highlighting inside Markdown code blocks in https://github.com/tact-lang/tact-language-server/pull/212
- feat(vscode): initial support for Blueprint and Tact Template build systems in https://github.com/tact-lang/tact-language-server/pull/237
- feat(documentation): add missing functions to `stubs/` and adjust the format to match the rest of other stdlib doc `///` comments by @novusnota in https://github.com/tact-lang/tact-language-server/pull/189
- feat(documentation): show use documentation for receiver and init functions in https://github.com/tact-lang/tact-language-server/pull/227
- feat(documentation): add installation instructions for Vim 8+ by @novusnota in https://github.com/tact-lang/tact-language-server/pull/231
- feat(documentation): show exit code in hover documentation of `require()` in https://github.com/tact-lang/tact-language-server/pull/243
- feat(documentation): add missing comptime functions to `stubs.tact` by @novusnota in https://github.com/tact-lang/tact-language-server/pull/248
- feat(documentation): show members of trait and contract in hover documentation in https://github.com/tact-lang/tact-language-server/pull/256
- feat(completion): automatically add necessary imports for symbols from other files in https://github.com/tact-lang/tact-language-server/pull/257
- feat(completion): show `self` type fields/methods in completion list in https://github.com/tact-lang/tact-language-server/pull/262
- feat(asm): better asm functions support in https://github.com/tact-lang/tact-language-server/pull/225
- feat(asm): show hint for top element in stack info, show new styled stack info in doc and completion in https://github.com/tact-lang/tact-language-server/pull/264
- feat(completion/resolving): better handling of imports in https://github.com/tact-lang/tact-language-server/pull/241
- feat(completion/resolving/documentation): add support for `fromCell` and `fromSlice` methods on structs and messages in https://github.com/tact-lang/tact-language-server/pull/233
- feat(linters): add Misti static analyzer to display by @skulidropek in https://github.com/tact-lang/tact-language-server/pull/26
- feat(compiler): initial compiler integration in https://github.com/tact-lang/tact-language-server/pull/236

### Fixed

- fix(fift): parsing of `DECLGLOBVAR` in Fift ASM in https://github.com/tact-lang/tact-language-server/pull/215
- fix(completion): fix documentation for function completion items in https://github.com/tact-lang/tact-language-server/pull/210
- fix(completion): for functions return type in https://github.com/tact-lang/tact-language-server/pull/218
- fix(completion): don't add extra `()` in `initOf` completion in https://github.com/tact-lang/tact-language-server/pull/226
- fix(completion): add parameters to contract completion inside `initOf` in https://github.com/tact-lang/tact-language-server/pull/258
- fix(inspections): don't warn on symbols with several declarations in https://github.com/tact-lang/tact-language-server/pull/232
- fix(documentation): fix list rendering in https://github.com/tact-lang/tact-language-server/pull/255
- fix(signature-help): for struct init inside function call in https://github.com/tact-lang/tact-language-server/pull/259
- fix(inspections): fix unused params inspection for function declarations in https://github.com/tact-lang/tact-language-server/pull/260
- fix(inlay-hints): don't show parameters hints for unary functions from stubs in https://github.com/tact-lang/tact-language-server/pull/263
- fix(resolving/completion): for methods on `T?` in https://github.com/tact-lang/tact-language-server/pull/229

### Testing

- feat(tests): add tests for Inlay Hints by @xpyctumo in https://github.com/tact-lang/tact-language-server/pull/206
- feat(tests): add more tests for inlay hints in https://github.com/tact-lang/tact-language-server/pull/209
- feat(tests): add tests for Signature Help by @xpyctumo in https://github.com/tact-lang/tact-language-server/pull/253

### Other

- adding `unicorn` for `eslint` by @Danil42Russia in https://github.com/tact-lang/tact-language-server/pull/192
- more strict `typescript-eslint` rules by @Danil42Russia in https://github.com/tact-lang/tact-language-server/pull/194
- updated the nightly build by @Danil42Russia in https://github.com/tact-lang/tact-language-server/pull/195
- chore: add mention of Open VSX Registry in https://github.com/tact-lang/tact-language-server/pull/213

### New Contributors

- @xpyctumo made their first contribution in https://github.com/tact-lang/tact-language-server/pull/206

## [0.1.0] - 2025-02-10

### Improvements

- feat(definition): add go to definition for `initOf` keyword in https://github.com/tact-lang/tact-language-server/pull/101
- feat(references): add find references for `init` function in https://github.com/tact-lang/tact-language-server/pull/104
- feat(completion): add completion for `initOf` and contracts in it in https://github.com/tact-lang/tact-language-server/pull/102
- feat(completion): take into account type of field inside default value completion in https://github.com/tact-lang/tact-language-server/pull/100
- feat(completion): add `do` snippet in https://github.com/tact-lang/tact-language-server/pull/106
- feat(completion): add constant declaration completion in traits and contracts in https://github.com/tact-lang/tact-language-server/pull/105
- feat(completion): add empty `receiver() {}` to completion in https://github.com/tact-lang/tact-language-server/pull/108
- feat(completion): add `external() {}` to completion in https://github.com/tact-lang/tact-language-server/pull/111
- feat(completion): add `bounced<>` to completion in https://github.com/tact-lang/tact-language-server/pull/112
- feat(completion): add `virtual fun foo() {}` to completion in https://github.com/tact-lang/tact-language-server/pull/114
- feat(completion): add `extends mutates fun foo(self: Type) {}` to completion in https://github.com/tact-lang/tact-language-server/pull/115
- feat(completion): add struct/message/trait/constant declaration completion in https://github.com/tact-lang/tact-language-server/pull/116
- feat(completion): show only messages in `bounced()` and `external()` receivers in https://github.com/tact-lang/tact-language-server/pull/124
- feat(completion): add initial implementation of postfix completion in https://github.com/tact-lang/tact-language-server/pull/166
- feat(completion): add `as` keyword completion in https://github.com/tact-lang/tact-language-server/pull/158
- feat(hover): show name of struct/message in hover documentation for fields/constants/functions in https://github.com/tact-lang/tact-language-server/pull/95
- feat(hover): show TL-B types in field documentation in https://github.com/tact-lang/tact-language-server/pull/125
- feat(hover): add documentation for TL-B types in https://github.com/tact-lang/tact-language-server/pull/110
- feat(hover): add documentation for receivers (`receive`, `bounced`, `external`) and `init()` constructor in https://github.com/tact-lang/tact-language-server/pull/145
- feat(signature-help): add Signature help for `initOf` in https://github.com/tact-lang/tact-language-server/pull/103
- feat(signature-help): add signature help for struct/message fields in https://github.com/tact-lang/tact-language-server/pull/135
- feat(document-symbols): sort elements by position in https://github.com/tact-lang/tact-language-server/pull/136
- feat(document-symbols): add imports, init() and message receivers (receive, external, bounced) in https://github.com/tact-lang/tact-language-server/pull/137
- feat(document-symbols): add settings to turn on/off fields in https://github.com/tact-lang/tact-language-server/pull/143
- feat(documentation): add mention of VSCodium / Cursor / Windsurf in README.md in https://github.com/tact-lang/tact-language-server/pull/138
- feat(documentation): add `tact` as language of code blocks for better highlighting in Helix/Neovim in https://github.com/tact-lang/tact-language-server/pull/139
- feat(ci): add archive with LS to nightly releases in https://github.com/tact-lang/tact-language-server/pull/147
- feat(find-usages): add setting for "Find Usages" scope in https://github.com/tact-lang/tact-language-server/pull/157
- feat(vscode-language-configuration): auto-insertion of `///` and concealment of `/**/` comments by @novusnota in https://github.com/tact-lang/tact-language-server/pull/93
- feat(vscode-language-configuration): add foldings of `// region: ` and `// endregion: ` and `colorizedBracketPairs` in https://github.com/tact-lang/tact-language-server/pull/160
- feat(intentions): initial intention to fill all/required struct/message fields in https://github.com/tact-lang/tact-language-server/pull/133
- feat(intention): add "Add explicit type" intention in https://github.com/tact-lang/tact-language-server/pull/127
- feat(intention): add initial implementation of intention to initialize field in `init()` in https://github.com/tact-lang/tact-language-server/pull/164
- feat(intention): add initial implementation of "wrap to" with try, try-catch and repeat in https://github.com/tact-lang/tact-language-server/pull/165
- feat(inline-hints): show `as int257` for `Int` fields in https://github.com/tact-lang/tact-language-server/pull/97
- feat(inspections): add inspection for symbols from other files without explicit import in https://github.com/tact-lang/tact-language-server/pull/129
- feat(configuration): add configuration for all type hints, code lenses and inspections in https://github.com/tact-lang/tact-language-server/pull/131
- feat(workspace): show error message if stdlib not found in https://github.com/tact-lang/tact-language-server/pull/132

### Fixed

- fix(hover): LS hangs when calling hover documentation on `receive() {}` in https://github.com/tact-lang/tact-language-server/pull/96
- fix(resolving): don't resolve variable before its declaration in https://github.com/tact-lang/tact-language-server/pull/118
- fix(completion): fix completion of variants with the same name in https://github.com/tact-lang/tact-language-server/pull/119
- fix(completion): and add brackets only if they are not there yet in https://github.com/tact-lang/tact-language-server/pull/120
- fix(completion): disable completion in variable declaration name in https://github.com/tact-lang/tact-language-server/pull/121
- fix(completion): disable completion in all function declaration names in https://github.com/tact-lang/tact-language-server/pull/122
- fix(completion): don't complete anything in parameters in https://github.com/tact-lang/tact-language-server/pull/156
- fix(resolve) resolving of inherited constants in https://github.com/tact-lang/tact-language-server/pull/45
- fix(resolve): inherit trait fields in child trait in https://github.com/tact-lang/tact-language-server/pull/99
- fix(resolve): function call with same name variable in scope in https://github.com/tact-lang/tact-language-server/pull/159
- fix(intention): don't do anything for "Fill in required fields..." if there are no such fields, or no fields to fill in at all in https://github.com/tact-lang/tact-language-server/pull/162
- fix(type-inference): for ternary expression with null branch in https://github.com/tact-lang/tact-language-server/pull/141
- fix(vscode-extension): fix Tact file icons in https://github.com/tact-lang/tact-language-server/pull/168
- fix(inspections): fix unused inspection for `_` names in https://github.com/tact-lang/tact-language-server/pull/107

### Other

- use `vscode-tact` id in https://github.com/tact-lang/tact-language-server/pull/37
- More eslint rules in https://github.com/tact-lang/tact-language-server/pull/56
- added `eslint` to the `husky` pre-hook by @Danil42Russia in https://github.com/tact-lang/tact-language-server/pull/134
- feat(CI): add nightly builds in https://github.com/tact-lang/tact-language-server/pull/142
- chore: update README.md in https://github.com/tact-lang/tact-language-server/pull/146
- refactor: fix `eslint` `unicorn` issues in https://github.com/tact-lang/tact-language-server/pull/169
- refactor: enable eslint all in https://github.com/tact-lang/tact-language-server/pull/170
- refactor: enable more eslint rules in https://github.com/tact-lang/tact-language-server/pull/171

### New Contributors

- @novusnota made their first contribution in https://github.com/tact-lang/tact-language-server/pull/93

## [0.0.1-alpha] - 2025-02-06

Initial development release for alpha testers
