// @ts-check

import path from "node:path"
import tseslint from "typescript-eslint"
import url from "node:url"

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

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

    tseslint.configs.stylistic,
    tseslint.configs.strictTypeChecked,

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
            "@typescript-eslint/no-base-to-string": "off",
            "@typescript-eslint/unbound-method": "off",
            "@typescript-eslint/no-misused-promises": "off",
            "@typescript-eslint/no-extraneous-class": "off",
            "@typescript-eslint/restrict-template-expressions": "off",
        },
    },
)
