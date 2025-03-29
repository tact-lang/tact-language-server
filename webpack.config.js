//@ts-check

"use strict"

const path = require("path")
const CopyPlugin = require("copy-webpack-plugin")
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin")
const webpack = require("webpack")

const distDir = path.resolve(__dirname, "dist")

/**@type {import('webpack').Configuration}*/
const config = {
    mode: "development",

    target: "webworker", // Changed from "node" to "webworker" for VS Code web

    entry: {
        server: "./server/src/server.ts",
        client: "./client/src/extension.ts",
    },
    output: {
        path: distDir,
        filename: "[name].js",
        libraryTarget: "commonjs-static",
        devtoolModuleFilenameTemplate: "../[resource-path]",
    },
    devtool: "source-map",
    externals: {
        vscode: "commonjs vscode",
    },

    resolve: {
        extensions: [".ts", ".js"],
        alias: {
            // provides alternate implementation for node module and source files
            "empty-module": path.resolve(__dirname, "node_modules/empty-module"),
            "path-scurry": path.resolve(__dirname, "node_modules/path-scurry"),
        },
        plugins: [new TsconfigPathsPlugin()],
        fallback: {
            buffer: require.resolve("buffer/"),
            process: require.resolve("process/browser"),
            path: require.resolve("path-browserify"),
            fs: false,
            crypto: require.resolve("crypto-browserify"),
            stream: require.resolve("stream-browserify"),
            util: require.resolve("util/"),
            assert: require.resolve("assert/"),
            url: require.resolve("url/"),
            events: require.resolve("events/"),
            string_decoder: require.resolve("string_decoder/"),
            child_process: false,
            console: require.resolve("console-browserify"),
            vm: require.resolve("vm-browserify"),
            "fs/promises": false,
            os: require.resolve("os-browserify/browser"),
            zlib: require.resolve("browserify-zlib"),
            http: require.resolve("stream-http"),
            https: require.resolve("https-browserify"),
            net: false,
            tls: false,
            dns: false,
            dgram: false,
            querystring: require.resolve("querystring-es3"),
            punycode: require.resolve("punycode/"),
            http2: false,
            perf_hooks: false,
            diagnostics_channel: false,
            async_hooks: false,
            timers: require.resolve("timers-browserify"),
            worker_threads: false,
            inspector: false,
            trace_events: false,
        },
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
        new webpack.ProvidePlugin({
            Buffer: ["buffer", "Buffer"],
            process: "process/browser",
        }),
        new webpack.DefinePlugin({
            "process.env": JSON.stringify(process.env),
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
