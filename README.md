# Tact Language Server

This language server/extension provides support for the [Tact programming language](https://tact-lang.org).

## Features

- Semantic syntax highlighting
- Code completion
- Go to definition, implementation, type definition
- Find all references, workspace symbol search, symbol renaming
- Types and documentation on hover
- Inlay hints for types and parameter names
- On-the-fly inspections with quick fixes
- Signature help inside calls, `initOf` and struct initialization
- Lenses with implementation/reference counts

## Quick start

The easiest way to get started with Tact is to use VS Code or editors based on it:

1. Install the [Tact language extension](https://marketplace.visualstudio.com/items?itemName=tonstudio.vscode-tact) for VS
   Code.
2. That's it!

Or, download the latest [release](https://github.com/tact-lang/tact-language-server/releases) and install it manually:

In VS Code (or VS Code-like editors):

- Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
- Type "Install from VSIX"
- Select the generated `.vsix` file
- Reload VS Code

The extension will automatically activate when you open any `.tact` file.

## Installation

First, clone and build the language server:

```shell
git clone https://github.com/tact-lang/tact-language-server
cd tact-language-server
yarn install
yarn build
```

### VS Code / VSCodium / Cursor / Windsurf

1. Run the following command to create the VSIX package:

    ```shell
    yarn package
    ```

2. In VS Code:
    - Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
    - Type "Install from VSIX"
    - Select the generated `.vsix` file
    - Reload VS Code

The extension will automatically activate when you open any `.tact` file.

### Helix

1. Make sure you have Helix installed and configured
2. Add the following configuration to your `~/.config/helix/languages.toml`:

    ```toml
    [[language]]
    name = "tact"
    language-servers = ["tact-language-server"]

    [language-server.tact-language-server]
    command = "node"
    args = ["path/to/language-server/dist/server.js", "--stdio"]
    ```

3. Replace `path/to/language-server` with the actual path where you cloned the repository
4. Restart Helix for changes to take effect

### Neovim

Prerequisites:

- [nvim-lspconfig](https://github.com/neovim/nvim-lspconfig)
- Neovim 0.5.0 or newer

Setup steps:

1. Add `tact.lua` to your `lua/lspconfig/server_configurations` directory with the following content:

    ```lua
    local util = require 'lspconfig.util'

    return {
      default_config = {
        cmd = { 'node', '/absolute/path/to/language-server/dist/server.js', '--stdio' },
        filetypes = { 'tact' },
        root_dir = util.root_pattern('package.json', '.git'),
      },
      docs = {
        description = [[
          Tact Language Server
          https://github.com/tact-lang/tact-language-server
        ]],
        default_config = {
          root_dir = [[root_pattern("package.json", ".git")]],
        },
      },
    }
    ```

2. Add the following to your `init.lua`:

    ```lua
    require'lspconfig'.tact.setup {}
    ```

### Sublime Text

1. Install [LSP](https://packagecontrol.io/packages/LSP) package:

    - Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
    - Select "Package Control: Install Package"
    - Search for and select "LSP"

2. Install the `Tact` package via Package Control for syntax highlighting

3. Add the following configuration to your LSP settings (`Preferences > Package Settings > LSP > Settings`):

    ```json
    {
        "clients": {
            "tact": {
                "enabled": true,
                "command": ["node", "path/to/language-server/dist/server.js", "--stdio"],
                "selector": "source.tact"
            }
        }
    }
    ```

4. Create a new file with `.tact` extension to verify the setup

## Troubleshooting

Common issues:

- Path to the language server is incorrect
- Node.js is not installed
- Language server wasn't built properly

### Logs Location

The language server generates logs that can help diagnose issues:

- For standalone server: logs are written to `dist/tact-language-server.log` in the language server directory
- For VS Code extension: logs can be found in:
    - Windows: `%USERPROFILE%\.vscode\extensions\tact-[version]\dist\tact-language-server.log`
    - macOS/Linux: `~/.vscode/extensions/tact-[version]/dist/tact-language-server.log`

For more help, please [open an issue](https://github.com/tact-lang/tact-language-server/issues).

# License

MIT
