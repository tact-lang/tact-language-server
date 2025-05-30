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
        plugins: [new (require("tsconfig-paths-webpack-plugin"))()],
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
    mode: "development",
    devtool: "source-map",
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
    mode: "development",
    devtool: "source-map",
    resolve: {
        ...commonConfig.resolve,
        fallback: {
            path: require.resolve("path-browserify"),
            "node:path": require.resolve("path-browserify"),
            "node:buffer": require.resolve("buffer"),
            crypto: require.resolve("crypto-browserify"),
            "node:crypto": require.resolve("crypto-browserify"),
            url: require.resolve("url/"),
            "node:url": require.resolve("url/"),
            fs: false,
            "node:fs": false,
            "node:fs/promises": false,
            os: require.resolve("os-browserify/browser"),
            "node:os": require.resolve("os-browserify/browser"),
            util: require.resolve("util"),
            buffer: require.resolve("buffer"),
            stream: require.resolve("stream-browserify"),
            "node:stream": require.resolve("stream-browserify"),
            "node:string_decoder": require.resolve("string_decoder"),
            "node:events": require.resolve("events"),
            child_process: false,
            "node:child_process": false,
            vm: require.resolve("vm-browserify"),
        },
        alias: {
            "empty-module": path.resolve(__dirname, "./empty-module"),
        },
    },
    module: {
        ...commonConfig.module,
        rules: [
            ...commonConfig.module.rules,
            {
                test: /\.m?js$/,
                resolve: {
                    fullySpecified: false,
                },
            },
        ],
    },
    target: "webworker",
    entry: {
        client: "./client/src/extension.ts",
    },
    output: {
        path: path.join(distDir, "web"),
        filename: "[name].js",
        libraryTarget: "commonjs2",
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
        new webpack.DefinePlugin({
            "process.env": JSON.stringify(process.env),
            global: "globalThis",
        }),
        new CopyPlugin({
            patterns: COPY_FILE_PATTERNS.map(pattern => ({
                ...pattern,
                to: pattern.to.replace(distDir, path.join(distDir, "web")),
            })),
        }),
        new webpack.NormalModuleReplacementPlugin(/^node:/, resource => {
            const mod = resource.request.replace(/^node:/, "")
            switch (mod) {
                case "buffer":
                    resource.request = "buffer"
                    break
                case "stream":
                    resource.request = "stream-browserify"
                    break
                case "path":
                    resource.request = "path-browserify"
                    break
                case "crypto":
                    resource.request = "crypto-browserify"
                    break
                case "util":
                    resource.request = "util"
                    break
                case "assert":
                    resource.request = "assert"
                    break
                case "url":
                    resource.request = "url"
                    break
                case "events":
                    resource.request = "events"
                    break
                case "string_decoder":
                    resource.request = "string_decoder"
                    break
                case "console":
                    resource.request = "console-browserify"
                    break
                case "os":
                    resource.request = "os-browserify/browser"
                    break
                case "timers":
                    resource.request = "timers-browserify"
                    break
                case "querystring":
                    resource.request = "querystring-es3"
                    break
                case "punycode":
                    resource.request = "punycode"
                    break
                case "zlib":
                    resource.request = "browserify-zlib"
                    break
                case "http":
                    resource.request = "stream-http"
                    break
                case "https":
                    resource.request = "https-browserify"
                    break
                case "fs":
                case "fs/promises":
                case "child_process":
                case "net":
                case "tls":
                case "dns":
                case "dgram":
                case "http2":
                case "perf_hooks":
                case "diagnostics_channel":
                case "async_hooks":
                case "worker_threads":
                case "inspector":
                case "trace_events":
                    resource.request = "empty-module"
                    break
                default:
                    throw new Error(`Not found ${resource.request}`)
            }
        }),
    ],
}

// Конфигурация для webworker (языковой сервер)
/**@type {import("webpack").Configuration}*/
const webWorkerConfig = {
    mode: "development",
    devtool: "source-map",
    resolve: {
        ...commonConfig.resolve,
        fallback: {
            path: require.resolve("path-browserify"),
            "node:path": require.resolve("path-browserify"),
            "node:buffer": require.resolve("buffer"),
            crypto: require.resolve("crypto-browserify"),
            "node:crypto": require.resolve("crypto-browserify"),
            url: require.resolve("url/"),
            "node:url": require.resolve("url/"),
            fs: false,
            "node:fs": false,
            "node:fs/promises": false,
            os: require.resolve("os-browserify/browser"),
            "node:os": require.resolve("os-browserify/browser"),
            util: require.resolve("util"),
            buffer: require.resolve("buffer"),
            stream: require.resolve("stream-browserify"),
            "node:stream": require.resolve("stream-browserify"),
            "node:string_decoder": require.resolve("string_decoder"),
            "node:events": require.resolve("events"),
            child_process: false,
            "node:child_process": false,
            vm: require.resolve("vm-browserify"),
        },
        alias: {
            "empty-module": path.resolve(__dirname, "./empty-module"),
        },
    },
    module: {
        ...commonConfig.module,
        rules: [
            ...commonConfig.module.rules,
            {
                test: /\.m?js$/,
                resolve: {
                    fullySpecified: false,
                },
            },
        ],
    },
    target: "webworker",
    entry: {
        server: "./server/src/server.ts",
    },
    output: {
        path: path.join(distDir, "web"),
        filename: "[name].js",
        globalObject: "self",
        devtoolModuleFilenameTemplate: "../[resource-path]",
    },
    externals: {
        // vscode API недоступно в webworker
    },
    plugins: [
        new webpack.ProvidePlugin({
            Buffer: ["buffer", "Buffer"],
            process: "process/browser",
        }),
        new webpack.DefinePlugin({
            "process.env": JSON.stringify(process.env),
            global: "globalThis",
        }),
        new webpack.NormalModuleReplacementPlugin(/^node:/, resource => {
            const mod = resource.request.replace(/^node:/, "")
            switch (mod) {
                case "buffer":
                    resource.request = "buffer"
                    break
                case "stream":
                    resource.request = "stream-browserify"
                    break
                case "path":
                    resource.request = "path-browserify"
                    break
                case "crypto":
                    resource.request = "crypto-browserify"
                    break
                case "util":
                    resource.request = "util"
                    break
                case "assert":
                    resource.request = "assert"
                    break
                case "url":
                    resource.request = "url"
                    break
                case "events":
                    resource.request = "events"
                    break
                case "string_decoder":
                    resource.request = "string_decoder"
                    break
                case "console":
                    resource.request = "console-browserify"
                    break
                case "os":
                    resource.request = "os-browserify/browser"
                    break
                case "timers":
                    resource.request = "timers-browserify"
                    break
                case "querystring":
                    resource.request = "querystring-es3"
                    break
                case "punycode":
                    resource.request = "punycode"
                    break
                case "zlib":
                    resource.request = "browserify-zlib"
                    break
                case "http":
                    resource.request = "stream-http"
                    break
                case "https":
                    resource.request = "https-browserify"
                    break
                case "fs":
                case "fs/promises":
                case "child_process":
                case "net":
                case "tls":
                case "dns":
                case "dgram":
                case "http2":
                case "perf_hooks":
                case "diagnostics_channel":
                case "async_hooks":
                case "worker_threads":
                case "inspector":
                case "trace_events":
                    resource.request = "empty-module"
                    break
                default:
                    throw new Error(`Not found ${resource.request}`)
            }
        }),
    ],
}

module.exports = (env, _argv) => {
    if (env && env.target === "web") {
        return [webConfig, webWorkerConfig]
    }
    return nodeConfig
}
