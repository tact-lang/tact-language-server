# Changelog

All notable changes to this project will be documented in this file.

## [0.0.1-alpha.2] - 2025-02-10

### Improvements

- feat(definition): add go to definition for `initOf` keyword in #101
- feat(references): add find references for `init` function in #104
- feat(completion): add completion for `initOf` and contracts in it in #102
- feat(completion): take into account type of field inside default value completion in #100
- feat(completion): add `do` snippet in #106
- feat(completion): add constant declaration completion in traits and contracts in #105
- feat(completion): add empty `receiver() {}` to completion in #108
- feat(completion): add `external() {}` to completion in #111
- feat(completion): add `bounced<>` to completion in #112
- feat(completion): add `virtual fun foo() {}` to completion in #114
- feat(completion): add `extends mutates fun foo(self: Type) {}` to completion in #115
- feat(completion): add struct/message/trait/constant declaration completion in #116
- feat(completion): show only messages in `bounced()` and `external()` receivers in #124
- feat(completion): add initial implementation of postfix completion in #166
- feat(completion): add `as` keyword completion in #158
- feat(hover): show name of struct/message in hover documentation for fields/constants/functions in #95
- feat(hover): show TL-B types in field documentation in #125
- feat(hover): add documentation for TL-B types in #110
- feat(hover): add documentation for receivers (`receive`, `bounced`, `external`) and `init()` constructor in #145
- feat(signature-help): add Signature help for `initOf` in #103
- feat(signature-help): add signature help for struct/message fields in #135
- feat(document-symbols): sort elements by position in #136
- feat(document-symbols): add imports, init() and message receivers (receive, external, bounced) in #137
- feat(document-symbols): add settings to turn on/off fields in #143
- feat(documentation): add mention of VSCodium / Cursor / Windsurf in README.md in #138
- feat(documentation): add `tact` as language of code blocks for better highlighting in Helix/Neovim in #139
- feat(ci): add archive with LS to nightly releases in #147
- feat(find-usages): add setting for "Find Usages" scope in #157
- feat(vscode-language-configuration): auto-insertion of `///` and concealment of `/**/` comments by @novusnota in #93
- feat(vscode-language-configuration): add foldings of `// region: ` and `// endregion: ` and `colorizedBracketPairs` in #160
- feat(intentions): initial intention to fill all/required struct/message fields in #133
- feat(intention): add "Add explicit type" intention in #127
- feat(intention): add initial implementation of intention to initialize field in `init()` in #164
- feat(intention): add initial implementation of "wrap to" with try, try-catch and repeat in #165
- feat(inline-hints): show `as int257` for `Int` fields in #97
- feat(inspections): add inspection for symbols from other files without explicit import in #129
- feat(configuration): add configuration for all type hints, code lenses and inspections in #131
- feat(workspace): show error message if stdlib not found in #132

### Fixed

- fix(hover): LS hangs when calling hover documentation on `receive() {}` in #96
- fix(resolving): don't resolve variable before its declaration in #118
- fix(completion): fix completion of variants with the same name in #119
- fix(completion): and add brackets only if they are not there yet in #120
- fix(completion): disable completion in variable declaration name in #121
- fix(completion): disable completion in all function declaration names in #122
- fix(completion): don't complete anything in parameters in #156
- fix(resolve) resolving of inherited constants in #45
- fix(resolve): inherit trait fields in child trait in #99
- fix(resolve): function call with same name variable in scope in #159
- fix(intention): don't do anything for "Fill in required fields..." if there are no such fields, or no fields to fill in at all in #162
- fix(type-inference): for ternary expression with null branch in #141
- fix(vscode-extension): fix Tact file icons in #168
- fix(inspections): fix unused inspection for `_` names in #107

### Other

- use `vscode-tact` id in #37
- More eslint rules in #56
- added `eslint` to the `husky` pre-hook by @Danil42Russia in #134
- feat(CI): add nightly builds in #142
- chore: update README.md in #146
- refactor: fix `eslint` `unicorn` issues in #169
- refactor: enable eslint all in #170
- refactor: enable more eslint rules in #171

## New Contributors

- @novusnota made their first contribution in #93

## [0.0.1-alpha] - 2025-02-06

Initial development release for alpha testers
