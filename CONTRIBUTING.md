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

## Building the Project

To build both the VS Code extension and the Language Server, you can use the following command:

```bash
yarn build
```

This command uses Webpack to bundle the necessary files.

For development, you can use the watch mode to automatically rebuild the project upon changes:

```bash
yarn watch
```

## VS Code extension

The VS Code extension is located in the `client/` folder. Also, the `package.json` file in the project root is the entry
point for the VS Code extension, describing its various properties, such as paths to files describing syntax
highlighting.

The
files: [language-configuration.json](language-configuration.json), [fift-language-configuration.json](fift-language-configuration.json), [tasm-language-configuration.json](tasm-language-configuration.json)
describe the language configuration for the extension.

To start developing the extension, run `yarn watch` in the root of the project and open
the [client/src/extension.ts](client/src/extension.ts) file in VS Code. For more detailed information,
see https://code.visualstudio.com/api/get-started/your-first-extension.

Since the extension is tightly coupled with the LS, this will also allow debugging code in the LS.

With the watch mode, when you make changes to the extension, the project will be automatically rebuilt, and you can
reload the window to see the changes.

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

There are other test-related scripts available:

- `yarn test`: Runs Jest tests.
- `yarn test:e2e:update`: Runs e2e tests and updates snapshots if they have changed.
- `yarn test:e2e:coverage`: Runs e2e tests and generates a coverage report.

Each feature has its tests in a separate folder within [server/src/e2e/suite](server/src/e2e/suite).
Currently, there is no way to run a specific test suite or an individual test within a suite.

The following test format is used for tests:

```
========================================================================
<name of the test>
========================================================================
<code>
------------------------------------------------------------------------
<expected result>
```

To automatically update expected results, run the following command:

```
yarn test:e2e:update
```

To create a new test file, create a new file with the `.test` extension in the desired folder.

## Grammar Development

If you are working on the Tact or Fift language grammars, you can use the following scripts to generate the necessary
WebAssembly files:

- To build both Tact and Fift WASM files:
    ```bash
    yarn grammar:wasm
    ```
- To build only the Tact WASM file:
    ```bash
    yarn grammar:tact:wasm
    ```
- To build only the Fift WASM file:
    ```bash
    yarn grammar:fift:wasm
    ```
    These scripts navigate to the respective `tree-sitter-tact` or `tree-sitter-fift` directories, generate the parser,
    and build the WASM module.

## Packaging the Extension

To package the VS Code extension into a `.vsix` file for distribution or local installation, run:

```bash
yarn package
```

This script uses `vsce package` to create the extension package. Ensure you have `vsce` installed globally or use
`npx vsce`.

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

## Pre-commit Hooks

This project uses [Husky](https://typicode.github.io/husky/) to manage pre-commit hooks. The hooks are configured to run
linters and formatters before each commit to ensure code quality and consistency. The setup is triggered by the
`postinstall` script in `package.json`.
