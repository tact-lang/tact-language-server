# Changelog

All notable changes to this project will be documented in this file.

## [0.5.0] - 2025-03-31

- Formatter in https://github.com/tact-lang/tact-language-server/pull/476

### Improvements

- feat(inlay-hints): show evaluation result for `ascii()` builtin function in https://github.com/tact-lang/tact-language-server/pull/502
- feat(inlay-hints): setting to disable all inlay-hints at once in https://github.com/tact-lang/tact-language-server/pull/519
- feat(inlay-hints): show evaluation result for `crc32()` builtin function in https://github.com/tact-lang/tact-language-server/pull/508
- feat(inspections): add inspection for `a = a + 10` with quickfix to `a += 10` in https://github.com/tact-lang/tact-language-server/pull/507
- feat(inspections): add an inspection for a function that does not use contract state and can be made standalone in https://github.com/tact-lang/tact-language-server/pull/509
- feat(inspections): add an inspection for fallback string receiver with branching for message text in https://github.com/tact-lang/tact-language-server/pull/512
- feat(inspections): add an inspection for implicitly discarded return value of a function call in https://github.com/tact-lang/tact-language-server/pull/514
- feat(documentation): show TL-B definition for structs, messages and contracts in documentation in https://github.com/tact-lang/tact-language-server/pull/521
- feat(documentation): add a setting to disable keyword documentation in https://github.com/tact-lang/tact-language-server/pull/523
- feat(documentation): hover docs for built-in keywords by @novusnota in https://github.com/tact-lang/tact-language-server/pull/493

### Fixed

- fix(documentation): `dump()` cannot be applied to values of `StringBuilder` type by @novusnota in https://github.com/tact-lang/tact-language-server/pull/475
- fix(indexing): fix "URL.parse is not a function" error in https://github.com/tact-lang/tact-language-server/pull/478
- fix(resolving): correctly resolve `sha256` with `String` argument in https://github.com/tact-lang/tact-language-server/pull/498
- fix(hover): don't process doc comments content in https://github.com/tact-lang/tact-language-server/pull/500
- fix(hover): don't process inline comments of previous declaration as doc comment in https://github.com/tact-lang/tact-language-server/pull/503
- fix(completion): don't add all methods to override completion in https://github.com/tact-lang/tact-language-server/pull/504
- fix(completion): show TL-B type completion in structs, messages and traits in https://github.com/tact-lang/tact-language-server/pull/506
- fix(inspections): better heuristic for unused imports in https://github.com/tact-lang/tact-language-server/pull/501
- fix(inspections): `StructInitializationInspection` now correctly resolves struct/message declarations in https://github.com/tact-lang/tact-language-server/pull/510
- fix(inlay-hints): don't show type hint for discard variable in https://github.com/tact-lang/tact-language-server/pull/516

## [0.4.1] - 2025-03-20

- fix(indexing): search of stdlib for new projects, and Tact toolchain in Tact compiler repo in https://github.com/tact-lang/tact-language-server/pull/470
- fix(documentation): grammar and spelling, ordering, links in https://github.com/tact-lang/tact-language-server/pull/465

## [0.4.0] - 2025-03-10

### Improvements

- feat(completion): add completion variants for TL-B types for fields in https://github.com/tact-lang/tact-language-server/pull/455
- feat(resolving): initial implementation of import-based resolving in https://github.com/tact-lang/tact-language-server/pull/445
- feat(resolving): prefer local definition when find definitions in https://github.com/tact-lang/tact-language-server/pull/439
- feat(indexing): improve indexes logic in https://github.com/tact-lang/tact-language-server/pull/443
- feat(definition): prefer project definitions over stdlib one in https://github.com/tact-lang/tact-language-server/pull/441
- feat(inlay-hints): don't show parameter hints for call argument with matching name in https://github.com/tact-lang/tact-language-server/pull/425
- feat(tests): better tests + fixes in https://github.com/tact-lang/tact-language-server/pull/383
- feat(vscode): add problem matcher to highlight errors after build in https://github.com/tact-lang/tact-language-server/pull/437
- feat(vscode): add command to run Misti on a project with installation if not installed in https://github.com/tact-lang/tact-language-server/pull/456
- feat(all): initial support for contract parameters in https://github.com/tact-lang/tact-language-server/pull/374
- feat(stubs): add doc comments for `fromSlice` and `fromCell` functions in https://github.com/tact-lang/tact-language-server/pull/420
- feat(documentation): add exit code documentation in https://github.com/tact-lang/tact-language-server/pull/400
- feat(documentation): better documentation for assembly instructions in https://github.com/tact-lang/tact-language-server/pull/459
- feat(foldings): add folding for Fift blocks in https://github.com/tact-lang/tact-language-server/pull/379
- feat(inspections): rewrite `send()` with `message()` or `deploy()` in https://github.com/tact-lang/tact-language-server/pull/405
- feat(inspections): rewrite `context().sender` with `sender()` in https://github.com/tact-lang/tact-language-server/pull/404
- feat(inspections): add inspection for Deployable with quickfix in https://github.com/tact-lang/tact-language-server/pull/457
- feat(intentions/inspections): add inspection and quickfix for text receivers in https://github.com/tact-lang/tact-language-server/pull/396
- feat(intentions): support `init(init: Init)` pattern in https://github.com/tact-lang/tact-language-server/pull/452

### Fixed

- fix(indexing): fix indexing on Windows in https://github.com/tact-lang/tact-language-server/pull/436
- fix(building): fix constructor modifier in https://github.com/tact-lang/tact-language-server/pull/442
- fix(document-symbols): document symbols now return whole range of declaration, not only name in https://github.com/tact-lang/tact-language-server/pull/454
- fix(inlay-hints): don't show size hint for `toCellI()` in method chain in https://github.com/tact-lang/tact-language-server/pull/432
- fix(foldings): add missing folding for messages in https://github.com/tact-lang/tact-language-server/pull/428
- fix(manual): fix link to issues in https://github.com/tact-lang/tact-language-server/pull/427
- fix(semantic-tokens): fix highlighting for some keywords in doc comments in https://github.com/tact-lang/tact-language-server/pull/424
- fix(vscode): don't cache disasm for BoC in https://github.com/tact-lang/tact-language-server/pull/422
- fix(signature-help): fix signature help for `initOf` for contracts with parameters in https://github.com/tact-lang/tact-language-server/pull/410
- fix(vscode): fix type of command, add selection of expression on a result, fix type of storage parameter in https://github.com/tact-lang/tact-language-server/pull/406
- fix(go-to-references): fix use scope for contract parameters in https://github.com/tact-lang/tact-language-server/pull/401
- fix(tests): fix tests in https://github.com/tact-lang/tact-language-server/pull/382
- fix(completion): fix completion for types of fields in https://github.com/tact-lang/tact-language-server/pull/381
- fix(completion): don't show getter completion for incomplete field in https://github.com/tact-lang/tact-language-server/pull/433
- fix(inspections): run inspections only on Tact files in https://github.com/tact-lang/tact-language-server/pull/378
- fix(inspections): run some inspections only on Tact 1.6 in https://github.com/tact-lang/tact-language-server/pull/458
- fix(documentation): correctly show T? type in https://github.com/tact-lang/tact-language-server/pull/380
- fix(documentation): fix contract parameters in contract documentation in https://github.com/tact-lang/tact-language-server/pull/426
- fix(documentation/inlay-hints): fix size calculation in https://github.com/tact-lang/tact-language-server/pull/377

### Other

- test: add folding tests in https://github.com/tact-lang/tact-language-server/pull/414
- chore: fix grammar in README.md in https://github.com/tact-lang/tact-language-server/pull/408
- chore: better README.md in https://github.com/tact-lang/tact-language-server/pull/397
- chore: add image to readme in https://github.com/tact-lang/tact-language-server/pull/402

## [0.3.2] - 2025-03-03

Bump a version of decompiler to v0.3.0.

## [0.3.1] - 2025-03-01

### Improvements

- feat(all): initial support for contract parameters in https://github.com/tact-lang/tact-language-server/pull/374
- feat(foldings): add folding for Fift blocks in https://github.com/tact-lang/tact-language-server/pull/379

### Fixed

- fix(completion): fix completion for types of fields in https://github.com/tact-lang/tact-language-server/pull/381
- fix(documentation): correctly show T? type in https://github.com/tact-lang/tact-language-server/pull/380
- fix(documentation/inlay-hints): fix size calculation in https://github.com/tact-lang/tact-language-server/pull/377
- fix(inspections): run inspections only on Tact files in https://github.com/tact-lang/tact-language-server/pull/378

### Other

- feat(tests): better tests, test fixes in https://github.com/tact-lang/tact-language-server/pull/383
- fix(tests): fix tests in https://github.com/tact-lang/tact-language-server/pull/382

## [0.3.0] - 2025-02-24

### Improvements

- feat(all): initial support for a destruct statement in https://github.com/tact-lang/tact-language-server/pull/355
- feat(all): initial support for `codeOf` in https://github.com/tact-lang/tact-language-server/pull/356
- feat(all): add support for `get` methods with explicit ID in https://github.com/tact-lang/tact-language-server/pull/358
- feat(grammar): port remaining grammar changes for 1.6.0 in https://github.com/tact-lang/tact-language-server/pull/359
- feat(vscode): integrate BoC decompiler in https://github.com/tact-lang/tact-language-server/pull/281
- feat(vscode): split settings to groups in https://github.com/tact-lang/tact-language-server/pull/312
- feat(vscode): port the latest version of TextMate grammar in https://github.com/tact-lang/tact-language-server/pull/353
- feat(inlay-hints): improve type hints in https://github.com/tact-lang/tact-language-server/pull/286
- feat(inlay-hints): don't show an obvious type hint for variable initialized with `Foo.fromCell()` in https://github.com/tact-lang/tact-language-server/pull/347
- feat(documentation/inlay-hints): show type for struct, messages and `toCell()` calls in https://github.com/tact-lang/tact-language-server/pull/318
- feat(highlighting): highlight code in doc comments in https://github.com/tact-lang/tact-language-server/pull/309
- feat(completion): add completion for getters in https://github.com/tact-lang/tact-language-server/pull/310
- feat(foldings): folding of doc comments in https://github.com/tact-lang/tact-language-server/pull/311
- feat(linters): run compiler and Misti checks on files in https://github.com/tact-lang/tact-language-server/pull/267
- feat(gas): take branching into account for gas calculation in https://github.com/tact-lang/tact-language-server/pull/321
- feat(build-system): add a Test task for Blueprint and Tact Template in https://github.com/tact-lang/tact-language-server/pull/335
- feat(build-system): add "build all contracts", "build and test all contracts" commands in https://github.com/tact-lang/tact-language-server/pull/336

### Manual

- manual: add initial completion page in https://github.com/tact-lang/tact-language-server/pull/289
- manual: add troubleshooting.md in https://github.com/tact-lang/tact-language-server/pull/314
- manual: add code lenses in https://github.com/tact-lang/tact-language-server/pull/305
- manual: add highlighting in https://github.com/tact-lang/tact-language-server/pull/315
- manual: add initial navigation in https://github.com/tact-lang/tact-language-server/pull/316
- manual: add gas-calculation page in https://github.com/tact-lang/tact-language-server/pull/322
- manual: add inlay hints in https://github.com/tact-lang/tact-language-server/pull/350

### Fixed

- fix(vscode): use flat settings keys in https://github.com/tact-lang/tact-language-server/pull/313
- fix(vscode): fix LS run on workspace without an open folder and on non-saved buffers in https://github.com/tact-lang/tact-language-server/pull/320
- fix(vscode): better wording for `compiler path` setting in https://github.com/tact-lang/tact-language-server/pull/328
- fix(imports): check for `name.tact` as well in https://github.com/tact-lang/tact-language-server/pull/323
- fix(linters): run compiler and Misti even for projects without `tact.config.json` in https://github.com/tact-lang/tact-language-server/pull/333
- fix(vscode): make command names uniform in https://github.com/tact-lang/tact-language-server/pull/334
- fix(completion): for contract/trait top-level in https://github.com/tact-lang/tact-language-server/pull/348
- fix(completion): fix auto imports for the current file elements and elements from files on level - X in https://github.com/tact-lang/tact-language-server/pull/296
- fix(resolving): support path with explicit `.tact` extension in https://github.com/tact-lang/tact-language-server/pull/349
- fix(indexing): don't ignore too many files in Tact compiler repo in https://github.com/tact-lang/tact-language-server/pull/351

### Other

- feat(ci): add changelog to nightly builds in https://github.com/tact-lang/tact-language-server/pull/324
- fix(tests): fix inlay hints tests in https://github.com/tact-lang/tact-language-server/pull/299
- feat(test): add completion tests with applying in editor by @xpyctumo in https://github.com/tact-lang/tact-language-server/pull/276
- feat(test): more completion tests in https://github.com/tact-lang/tact-language-server/pull/279
- feat(test): more intentions tests in https://github.com/tact-lang/tact-language-server/pull/280
- chore: update README.md in https://github.com/tact-lang/tact-language-server/pull/266
- chore: change priorities of editors in the README by @novusnota in https://github.com/tact-lang/tact-language-server/pull/278
- disabling `postinstall` scripts for third-party dependencies by @Danil42Russia in https://github.com/tact-lang/tact-language-server/pull/288
- chore: use @tact-lang/opcode v0.2 in https://github.com/tact-lang/tact-language-server/pull/295
- chore(documentation): override completions in Sublime Text by @novusnota in https://github.com/tact-lang/tact-language-server/pull/354

## [0.2.1] - 2025-02-20

Fixed critical bug in auto-import completion.

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
- feat(documentation): add installation instructions for Vim 8+ by @novusnota in https://github.com/tact-lang/tact-language-server/pull/231

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
