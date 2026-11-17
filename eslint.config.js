import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["node_modules/**"] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },

  // Los tests usan las funciones globales de Jest (describe, test, expect, jest...)
  {
    files: ["tests/**/*.js"],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
    },
    rules: {
      // Algunos tests ejecutan funciones dentro de try/catch vacios a proposito
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
];