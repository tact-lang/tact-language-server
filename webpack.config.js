//@ts-check

"use strict"

const path = require("path")
const CopyPlugin = require("copy-webpack-plugin")
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin")

const distDir = path.resolve(__dirname, "dist")

/**@type {import('webpack').Configuration}*/
const config = {
    mode: "development",

    target: "node", // vscode extensions run in webworker context for VS Code web 📖 -> https://webpack.js.org/configuration/target/#target

    entry: {
        server: "./server/src/server.ts",
        client: "./client/src/extension.ts",
        debugAdapter: "./src/debugAdapter/main.ts",
    }, // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
    output: {
        // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
        path: distDir,
        filename: "[name].js",
        libraryTarget: "commonjs2",
        devtoolModuleFilenameTemplate: "../[resource-path]",
    },
    devtool: "source-map",
    externals: {
        vscode: "commonjs vscode", // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
        "vscode-debugadapter": "commonjs vscode-debugadapter",
    },

    resolve: {
        extensions: [".ts", ".js"],
        alias: {
            // provides alternate implementation for node module and source files
        },
        plugins: [new TsconfigPathsPlugin()],
        fallback: {},
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "ts-loader",
                    },
                ],
            },
        ],
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                {from: "./node_modules/web-tree-sitter/tree-sitter.wasm", to: distDir},
                {from: "./stubs/stubs.tact", to: path.join(distDir, "stubs")},
                {from: "./tree-sitter-tact/tree-sitter-tact.wasm", to: distDir},
                {from: "./tree-sitter-fift/tree-sitter-fift.wasm", to: distDir},
                {from: "./icons/ton-icon.svg", to: path.join(distDir, "icons")},
                {from: "./icons/icon-light.svg", to: path.join(distDir, "icons")},
                {from: "./icons/icon-dark.svg", to: path.join(distDir, "icons")},
                {
                    from: "server/src/completion/data/asm.json",
                    to: distDir,
                },
            ],
        }),
    ],
}
module.exports = config
