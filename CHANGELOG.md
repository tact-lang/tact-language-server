# Changelog

All notable changes to this project will be documented in this file.

## [0.0.1-alpha.2] - 2025-02-10

## What's Changed

### Improvements

- use `vscode-tact` id by @i582 in https://github.com/tact-lang/tact-language-server/pull/37
- chore: auto-insertion of `///` and concealment of `/**/` comments by @novusnota in https://github.com/tact-lang/tact-language-server/pull/93
- feat(hover): show name of struct/message in hover documentation for fields/constants/functions by @i582 in https://github.com/tact-lang/tact-language-server/pull/95
- feat(completion): take into account type of field inside default value completion by @i582 in https://github.com/tact-lang/tact-language-server/pull/100
- feat(inline-hints): show `as int257` for `Int` fields by @i582 in https://github.com/tact-lang/tact-language-server/pull/97
- feat(definition): add go to definition for `initOf` keyword by @i582 in https://github.com/tact-lang/tact-language-server/pull/101
- feat(completion): add completion for `initOf` and contracts in it by @i582 in https://github.com/tact-lang/tact-language-server/pull/102
- feat(signature-help): add Signature help for `initOf` by @i582 in https://github.com/tact-lang/tact-language-server/pull/103
- feat(references): add find references for `init` function by @i582 in https://github.com/tact-lang/tact-language-server/pull/104
- feat(completion): add `do` snippet by @i582 in https://github.com/tact-lang/tact-language-server/pull/106
- feat(completion): add constant declaration completion in traits and contracts by @i582 in https://github.com/tact-lang/tact-language-server/pull/105
- fix(inspections): fix unused inspection for `_` names by @i582 in https://github.com/tact-lang/tact-language-server/pull/107
- feat(completion): add empty `receiver() {}` to completion by @i582 in https://github.com/tact-lang/tact-language-server/pull/108
- feat(hover): add documentation for TL-B types by @i582 in https://github.com/tact-lang/tact-language-server/pull/110
- feat(completion): add `external() {}` to completion by @i582 in https://github.com/tact-lang/tact-language-server/pull/111
- feat(completion): add `bounced<>` to completion by @i582 in https://github.com/tact-lang/tact-language-server/pull/112
- feat(completion): add `virtual fun foo() {}` to completion by @i582 in https://github.com/tact-lang/tact-language-server/pull/114
- feat(completion): add `extends mutates fun foo(self: Type) {}` to completion by @i582 in https://github.com/tact-lang/tact-language-server/pull/115
- feat(completion): add struct/message/trait/constant declaration completion by @i582 in https://github.com/tact-lang/tact-language-server/pull/116
- feat(completion): show only messages in `bounced()` and `external()` receivers by @i582 in https://github.com/tact-lang/tact-language-server/pull/124
- feat(hover): show TL-B types in field documentation by @i582 in https://github.com/tact-lang/tact-language-server/pull/125
- feat(intention): add "Add explicit type" intention by @i582 in https://github.com/tact-lang/tact-language-server/pull/127
- feat(inspections): add inspection for symbols from other files without explicit import by @i582 in https://github.com/tact-lang/tact-language-server/pull/129
- feat(configuration): add configuration for all type hints, code lenses and inspections by @i582 in https://github.com/tact-lang/tact-language-server/pull/131
- feat(workspace): show error message if stdlib not found by @i582 in https://github.com/tact-lang/tact-language-server/pull/132
- feat(intentions): initial intention to fill all/required struct/message fields by @i582 in https://github.com/tact-lang/tact-language-server/pull/133
- feat(signature-help): add signature help for struct/message fields by @i582 in https://github.com/tact-lang/tact-language-server/pull/135
- feat(document-symbols): sort elements by position by @i582 in https://github.com/tact-lang/tact-language-server/pull/136
- feat(document-symbols): add imports, init() and message receivers (receive, external, bounced) by @i582 in https://github.com/tact-lang/tact-language-server/pull/137
- documentation: add mention of VSCodium / Cursor / Windsurf in README.md by @i582 in https://github.com/tact-lang/tact-language-server/pull/138
- feat(documentation): add `tact` as language of code blocks for better highlighting in Helix/Neovim by @i582 in https://github.com/tact-lang/tact-language-server/pull/139
- feat(document-symbols): add settings to turn on/off fields by @i582 in https://github.com/tact-lang/tact-language-server/pull/143
- feat(hover): add documentation for receivers (`receive`, `bounced`, `external`) and `init()` constructor by @i582 in https://github.com/tact-lang/tact-language-server/pull/145
- feat(ci): add archive with LS to nightly releases by @i582 in https://github.com/tact-lang/tact-language-server/pull/147
- feat(find-usages): add setting for "Find Usages" scope by @i582 in https://github.com/tact-lang/tact-language-server/pull/157
- feat(completion): add `as` keyword completion by @i582 in https://github.com/tact-lang/tact-language-server/pull/158
- feat(vscode-language-configuration): add foldings of `// region: ` and `// endregion: ` and `colorizedBracketPairs` by @i582 in https://github.com/tact-lang/tact-language-server/pull/160
- feat(intention): add initial implementation of intention to initialize field in `init()` by @i582 in https://github.com/tact-lang/tact-language-server/pull/164
- feat(intention): add initial implementation of "wrap to" with try, try-catch and repeat by @i582 in https://github.com/tact-lang/tact-language-server/pull/165
- feat(completion): add initial implementation of postfix completion by @i582 in https://github.com/tact-lang/tact-language-server/pull/166

### Fixed

- fixed resolving of inherited constants by @i582 in https://github.com/tact-lang/tact-language-server/pull/45
- fix(resolve): inherit trait fields in child trait by @i582 in https://github.com/tact-lang/tact-language-server/pull/99
- fix(hover): LS hangs when calling hover documentation on `receive() {}` by @i582 in https://github.com/tact-lang/tact-language-server/pull/96
- fix(resolving): don't resolve variable before its declaration by @i582 in https://github.com/tact-lang/tact-language-server/pull/118
- fix(completion): fix completion of variants with the same name by @i582 in https://github.com/tact-lang/tact-language-server/pull/119
- fix(completion): and add brackets only if they are not there yet by @i582 in https://github.com/tact-lang/tact-language-server/pull/120
- fix(completion): disable completion in variable declaration name by @i582 in https://github.com/tact-lang/tact-language-server/pull/121
- fix(completion): disable completion in all function declaration names by @i582 in https://github.com/tact-lang/tact-language-server/pull/122
- fix(type-inference): for ternary expression with null branch by @i582 in https://github.com/tact-lang/tact-language-server/pull/141
- fix(completion): don't complete anything in parameters by @i582 in https://github.com/tact-lang/tact-language-server/pull/156
- fix(resolve): function call with same name variable in scope by @i582 in https://github.com/tact-lang/tact-language-server/pull/159
- fix(intention): don't do anything for "Fill in required fields..." if there are no such fields, or no fields to fill in at all by @i582 in https://github.com/tact-lang/tact-language-server/pull/162
- fix(vscode-extension): fix Tact file icons by @i582 in https://github.com/tact-lang/tact-language-server/pull/168

### Other

- More eslint rules by @i582 in https://github.com/tact-lang/tact-language-server/pull/56
- added `eslint` to the `husky` pre-hook by @Danil42Russia in https://github.com/tact-lang/tact-language-server/pull/134
- feat(CI): add nightly builds by @i582 in https://github.com/tact-lang/tact-language-server/pull/142
- chore: update README.md by @i582 in https://github.com/tact-lang/tact-language-server/pull/146
- refactor: fix `eslint` `unicorn` issues by @i582 in https://github.com/tact-lang/tact-language-server/pull/169
- refactor: enable eslint all by @i582 in https://github.com/tact-lang/tact-language-server/pull/170
- refactor: enable more eslint rules by @i582 in https://github.com/tact-lang/tact-language-server/pull/171

## New Contributors

- @novusnota made their first contribution in https://github.com/tact-lang/tact-language-server/pull/93

**Full Changelog**: https://github.com/tact-lang/tact-language-server/compare/v0.0.1-alpha...v0.0,1-alpha.2

## [0.0.1-alpha] - 2025-02-06

Initial development release for alpha testers
