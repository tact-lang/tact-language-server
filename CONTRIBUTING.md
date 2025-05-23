# Contributing

This repository contains two projects. The first is a VS Code extension for Tact language support, and the second is a
Language Server that provides all the smart features for the VS Code extension, as well as for other editors that
support the [LSP](https://microsoft.github.io/language-server-protocol/) (Language Server Protocol). The Language Server
Protocol is a way for a server, which can provide smart features like autocompletion or go-to-definition, to communicate
with an editor.

## Getting Started

### Prerequisites

- Node.js (version specified in `.nvmrc` if available, otherwise latest LTS)
- Yarn (Classic or Berry)
- VS Code (for extension development)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/tact-lang/tact-language-server.git
cd tact-language-server
```

2. Install dependencies:

```bash
yarn install
```

## VS Code extension

The VS Code extension is located in the `client/` folder. Also, the `package.json` file in the project root is the entry
point for the VS Code extension, describing its various properties, such as paths to files describing syntax
highlighting.

The
files: [language-configuration.json](language-configuration.json), [fift-language-configuration.json](fift-language-configuration.json), [tasm-language-configuration.json](tasm-language-configuration.json)
describe the language configuration for the extension.

To start developing the extension, simply open the [client/src/extension.ts](client/src/extension.ts) file in VS Code
and press `F5`. For more detailed information, see https://code.visualstudio.com/api/get-started/your-first-extension.

Since the extension is tightly coupled with the LS, this will also allow debugging code in the LS.

## Language Server

The Language Server is located in the `server/` folder.

The general architecture of the LS can be described as follows:

### High-level architecture

#### Parsing

[tree-sitter](https://tree-sitter.github.io/tree-sitter/) is used to build the CST (Concrete Syntax Tree). There are 2
main grammars currently in use:

1. [tree-sitter-tact](tree-sitter-tact) — Tact grammar, which mostly mirrors the official
   one (https://github.com/tact-lang/tree-sitter-tact). One of the main differences is that it makes some semicolons
   optional for better error recovery in invalid code.
2. [tree-sitter-fift](tree-sitter-fift) — TVM Assembly grammar

#### Indexes

Due to the small size of Tact projects, to simplify the architecture, when a project is launched, we store all project
files, as well as the stdlib, in memory. This gives the LS instant access to any definitions from any files.

#### Endpoints

The [server/src/server.ts](server/src/server.ts) file describes all the entry points (and therefore features) that the
LS provides.
More complex features have separate folders for their implementation, while some are implemented directly in
`server.ts`.

##### Documentation

For assembler documentation, we use a [specification file](https://github.com/ton-community/tvm-spec/issues) in JSON
format, which contains descriptions of TVM instructions. Its local version is located
in [asm.json](server/src/completion/data/asm.json). This file is also used for autocompleting instructions within asm
functions.

### Testing

For LS testing, we use end-to-end (e2e) tests that run in a separate instance of VS Code. This setup allows us to test
the LS in conditions that closely mimic real-world usage.

All tests are located in the [server/src/e2e](server/src/e2e) folder.

To run the tests, execute the following command:

```
yarn test:e2e
```

Each individual feature has its tests in a separate folder within [server/src/e2e/suite](server/src/e2e/suite).
Currently, there is no way to run a specific test suite or an individual test within a suite.

The following test format is used for descriptions:

```
========================================================================
<name of the test>
========================================================================
<code>
------------------------------------------------------------------------
<expected result>
```

To automatically update expected results, execute the following command:

```
yarn test:e2e:update
```

To create a new test file, simply create a new file with the `.test` extension in the desired folder.

## Code Style

This project uses ESLint for linting and Prettier for formatting.

- To lint your code, run:
    ```bash
    yarn lint
    ```
- To format your code, run:
    ```bash
    yarn fmt
    ```
- To check for formatting issues without applying changes, run:
    ```bash
    yarn fmt:check
    ```

It's recommended to set up your editor to automatically format code on save and to install an ESLint plugin for
real-time feedback.
