const js = require("@eslint/js");
const n = require("eslint-plugin-n");
const globals = require("globals");

module.exports = [
  { ignores: ["node_modules/**", "coverage/**", "backups/**"] },
  js.configs.recommended,
  {
    files: ["src/**/*.js", "scripts/**/*.js", "seed/**/*.js"],
    ...n.configs["flat/recommended-script"],
    languageOptions: { ecmaVersion: 2023, sourceType: "commonjs", globals: { ...globals.node } },
    rules: {
      ...n.configs["flat/recommended-script"].rules,
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" }],
      // process.exit is intended in the boot/shutdown path and in CLI scripts
      "n/no-process-exit": "off",
    },
  },
  {
    files: ["eslint.config.js"],
    languageOptions: { sourceType: "commonjs", globals: { ...globals.node } },
  },
  {
    files: ["tests/**/*.js", "vitest.config.mjs"],
    ...n.configs["flat/recommended-module"],
    languageOptions: { ecmaVersion: 2023, sourceType: "module", globals: { ...globals.node } },
    rules: {
      ...n.configs["flat/recommended-module"].rules,
      "n/no-unpublished-import": "off",
    },
  },
];
