![](https://repository-images.githubusercontent.com/909472615/e506e618-b03f-47ba-8bf9-0e1175692c80)

# Tact Language Server

## Installation

```shell
git clone https://github.com/i582/language-server
cd language-server
yarn install
yarn grammar:wasm
yarn build
```

### VS Code

If you want to run LS in VS Code, also run the following command to create the extension.

```shell
yarn package
```

In VS Code, open the Command Pallet, type "Install from VSIX", select the file, and reload VS Code.

## Run

```shell
node ./dist/server.js --stdio
```

# License

MIT
