# Contributing

This repository hosts two main parts: a VS Code extension for Tact language support and a Language Server. The
Language Server implements the [Language Server Protocol (LSP)](https://microsoft.github.io/language-server-protocol/),
enabling smart features like autocompletion and go-to-definition for the VS Code extension and other LSP-compatible
editors.

## Getting Started

### Prerequisites

Ensure you have the following software installed:

- **Node.js**: Version 22.x is recommended (aligns with our CI/CD pipelines).
- **Yarn**: Classic or Berry.
- **Visual Studio Code**: For extension development.

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

To build the VS Code extension and Language Server, run:

```bash
yarn build
```

This command uses Webpack to bundle the project files.

For development, enable watch mode to automatically rebuild on file changes:

```bash
yarn watch
```

## VS Code extension

The VS Code extension code resides in the `client/` directory. The root `package.json` file serves as the extension's
manifest, defining properties like syntax highlighting paths.

Language-specific editor features like comment toggling, bracket matching, and auto-closing pairs are defined in:

- [client/src/languages/language-configuration.json](client/src/languages/language-configuration.json) (for Tact)
- [client/src/languages/fift-language-configuration.json](client/src/languages/fift-language-configuration.json) (for
  Fift)
- [client/src/languages/tasm-language-configuration.json](client/src/languages/tasm-language-configuration.json) (for
  TASM)

Refer to
the [VS Code Language Configuration Guide](https://code.visualstudio.com/api/language-extensions/language-configuration-guide)
for more details on these files.

To begin developing the extension:

1. Run `yarn watch` in the project root. This starts the build in watch mode.
2. Open the project folder in VS Code.
3. The main extension point is in `client/src/extension.ts`.
4. Press `F5` to start debugging the extension.

When you make changes, the project will automatically rebuild. Reload the VS Code window (Developer: Reload Window)
where you are testing the extension to see the changes. For general information, see
the [VS Code extension documentation](https://code.visualstudio.com/api/get-started/your-first-extension).

This development setup also facilitates debugging the Language Server, as it runs within the same development host.

## Language Server

The Language Server is located in the `server/` folder.

The general architecture of the LS can be described as follows:

### High-level architecture

#### Parsing

We use [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) to parse code and build Concrete Syntax Trees (CSTs).
The primary grammars are:

1. [tree-sitter-tact](tree-sitter-tact) — Tact grammar, which mostly mirrors the official
   one (https://github.com/tact-lang/tree-sitter-tact). One of the main differences is that it makes some semicolons
   optional for better error recovery in invalid code.
2. [tree-sitter-fift](tree-sitter-fift) — TVM Assembly grammar

#### Indexes

To simplify the architecture and leverage the typically small size of Tact projects, the Language Server loads all
project files and the standard library into memory upon initialization. This approach provides instant access to
definitions across files.

#### Endpoints

The main entry points for Language Server features are defined in `server/src/server.ts`. Implementations for more
complex features are organized into separate directories, while simpler ones may be found directly within `server.ts`.

##### Documentation

TVM instruction descriptions for assembler documentation and autocompletion are sourced from a JSON specification file.
A local copy is maintained at `server/src/completion/data/asm.json`, originally based on
the [TVM Spec](https://github.com/ton-community/tvm-spec/issues).

### Testing

For LS testing, we use end-to-end (e2e) tests that run in a separate instance of VS Code. This setup allows us to test
the LS in conditions that closely mimic real-world usage.

All tests are located in the [server/src/e2e](server/src/e2e) folder.

To run the tests, execute the following command:

```
yarn test:e2e
```

Other available test scripts include:

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

To update test snapshots automatically:

```
yarn test:e2e:update
```

To add a new test, create a file with a `.test` extension in the relevant feature's test directory.

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

We recommend configuring your editor to format code on save and installing an ESLint plugin for real-time linting
feedback.

## Pre-commit Hooks

This project uses [Husky](https://typicode.github.io/husky/) to manage pre-commit hooks. These hooks automatically run
linters and formatters before each commit, helping to maintain code quality and consistency. Husky is set up via the
`postinstall` script in `package.json`.

## Release process

This section outlines the steps for releasing the Tact Language Server to NPM and packaging the VS Code extension for
the VS Code Marketplace.

### Language Server (NPM)

The Language Server is published to NPM as `@tact-lang/tact-language-server`. The metadata for this package (name,
version, etc.) is defined in `package.server.json`, which is copied to `dist/package.json` during the build process.

The primary way to publish the Language Server to NPM is by using the all-in-one script:

1. Ensure the version in `package.server.json` is updated and all changes are committed.
2. Run the script:

    ```bash
    yarn build-server-package-and-publish
    ```

    This script will:

    - Run `yarn build` to compile the project and prepare the `dist` directory.
    - Run `yarn pack:ls` to create a local `.tgz` tarball of the package.
      This is useful for local testing before publishing.
    - Run `yarn publish:ls` to publish the package to NPM.

    You need to be logged in to NPM (`npm login`) for the publication step to succeed.

### VS Code Extension (Marketplace)

To package the VS Code extension for release:

1. Ensure the `version` in the root `package.json` is updated and all changes are committed.
   The `README-extension.md` (used for the marketplace description) should also be up to date.
2. Run the packaging script:
    ```bash
    yarn build && yarn package
    ```
    This command uses `npx vsce package` to create a `.vsix` file (e.g.,
    `vscode-tact-0.7.1.vsix`) in the root of the project.
3. The generated `.vsix` file can then be uploaded to
   the [VS Code Marketplace](https://marketplace.visualstudio.com/manage/publishers/).

Refer to the
official [VS Code documentation for publishing extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
for more details on the marketplace upload process.
