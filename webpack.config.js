//@ts-check

"use strict"

const path = require("path")
const CopyPlugin = require("copy-webpack-plugin")
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin")
const webpack = require("webpack")

const distDir = path.resolve(__dirname, "dist")

const COPY_FILE_PATTERNS = [
    {from: "./node_modules/web-tree-sitter/tree-sitter.wasm", to: distDir},
    {
        from: "./server/src/languages/tact/stubs/stubs.tact",
        to: path.join(distDir, "stubs"),
    },
    {
        from: "./server/src/languages/tact/tree-sitter-tact/tree-sitter-tact.wasm",
        to: distDir,
    },
    {
        from: "./server/src/languages/fift/tree-sitter-fift/tree-sitter-fift.wasm",
        to: distDir,
    },
    {
        from: "./server/src/languages/tlb/tree-sitter-tlb/tree-sitter-tlb.wasm",
        to: distDir,
    },
    {from: "./client/src/assets/icons/ton-icon.svg", to: path.join(distDir, "icons")},
    {
        from: "./client/src/assets/icons/icon-tact-dark.svg",
        to: path.join(distDir, "icons"),
    },
    {
        from: "./client/src/assets/icons/icon-tasm-dark.svg",
        to: path.join(distDir, "icons"),
    },
    {
        from: "./client/src/assets/icons/icon-tlb-dark.svg",
        to: path.join(distDir, "icons"),
    },
    {
        from: "./client/src/assets/icons/icon-boc-dark.svg",
        to: path.join(distDir, "icons"),
    },
    {
        from: "server/src/languages/tact/completion/data/asm.json",
        to: distDir,
    },
    {from: "./package.server.json", to: path.join(distDir, "package.json")},
    {from: "./README.md", to: path.join(distDir, "README.md")},
]

const commonConfig = {
    mode: "development",
    devtool: "source-map",
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
}

/**@type {import("webpack").Configuration}*/
const nodeConfig = {
    mode: commonConfig.mode,
    devtool: commonConfig.devtool,
    resolve: {
        ...commonConfig.resolve,
        fallback: {},
    },
    module: commonConfig.module,
    target: "node",
    entry: {
        server: "./server/src/server.ts",
        client: "./client/src/extension.ts",
    },
    output: {
        path: distDir,
        filename: "[name].js",
        libraryTarget: "commonjs2",
        devtoolModuleFilenameTemplate: "../[resource-path]",
    },
    externals: {
        vscode: "commonjs vscode",
    },
    plugins: [
        new webpack.BannerPlugin({
            banner: "#!/usr/bin/env node",
            raw: true,
            include: "server.js",
        }),
        new CopyPlugin({
            patterns: COPY_FILE_PATTERNS,
        }),
    ],
}

// Конфигурация для VS Code Web (Browser/WebWorker)
/**@type {import("webpack").Configuration}*/
const webConfig = {
    mode: commonConfig.mode,
    devtool: commonConfig.devtool,
    resolve: {
        ...commonConfig.resolve,
        fallback: {
            path: require.resolve("path-browserify"),
            "node:buffer": require.resolve("buffer"),
            crypto: require.resolve("crypto-browserify"),
            url: require.resolve("url/"),
            "node:url": require.resolve("url/"),
            fs: false,
            "node:fs": false,
            os: false,
            util: require.resolve("util"),
            buffer: require.resolve("buffer"),
            stream: require.resolve("stream-browserify"),
            child_process: false,
        },
    },
    module: commonConfig.module,
    target: "webworker",
    entry: {
        server: "./server/src/server.ts",
        client: "./client/src/extension.ts",
    },
    output: {
        path: path.join(distDir, "web"),
        filename: "[name].js",
        libraryTarget: "commonjs-static",
        devtoolModuleFilenameTemplate: "../[resource-path]",
    },
    externals: {
        vscode: "commonjs vscode",
    },
    plugins: [
        new webpack.ProvidePlugin({
            Buffer: ["buffer", "Buffer"],
            process: "process/browser",
        }),
        new CopyPlugin({
            patterns: COPY_FILE_PATTERNS,
        }),
    ],
}

module.exports = (env, _argv) => {
    if (env && env.target === "web") {
        return webConfig
    }
    return nodeConfig
}
