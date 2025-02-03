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
            "eslint.config.mjs",
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

        rules: {
            "@typescript-eslint/no-empty-function": ["error", {allow: ["arrowFunctions"]}],
            "@typescript-eslint/no-inferrable-types": "off",
            "@typescript-eslint/typedef": [
                "error",
                {parameter: true, memberVariableDeclaration: true},
            ],
            "@typescript-eslint/consistent-generic-constructors": ["error", "type-annotation"],
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
