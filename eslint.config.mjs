// @ts-check

import path from "path"
import tseslint from "typescript-eslint"
import {fileURLToPath} from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default tseslint.config(
    // register plugins
    {
        plugins: {
            ["@typescript-eslint"]: tseslint.plugin,
        },
    },

    // add files and folders to be ignored
    {
        ignores: [
            "**/*.js",
            ".github/*",
            ".yarn/*",
            ".vscode-test/*",
            "dist/*",
            "docs/*",
            "tree-sitter-fift/",
            "tree-sitter-tact/",
        ],
    },

    tseslint.configs.recommended,

    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: __dirname,
            },
        },
    },

    {
        rules: {
            "@typescript-eslint/no-unused-vars": "off",
        },
    },
)
