module.exports = {
    root: true,
    env: {
        es2020: true,
        node: true,
    },
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        sourceType: "module",
        ecmaVersion: 2020,
    },
    ignorePatterns: [
        "/lib/**/*",              // Ignore compiled JS output
        "/node_modules/**/*",
        ".eslintrc.js",           // Do not lint the eslint config itself
    ],
    plugins: ["@typescript-eslint"],
    rules: {
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-non-null-assertion": "off",
        // Allow unused vars prefixed with _ (common pattern in callbacks)
        "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    },
};
