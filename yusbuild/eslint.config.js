import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist", "dist-dev", "coverage"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Architectural boundaries from FRONTEND_ARCHITECTURE.md. These are the
      // enforcement teeth for rules the docs state but nothing checked.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "axios",
              message:
                "Use the shared client in @/lib/api instead. Direct axios calls in components are prohibited.",
            },
          ],
          patterns: [
            {
              group: ["@/_prototype", "@/_prototype/**"],
              message:
                "The prototype is a visual reference only and is excluded from production builds. Do not import it.",
            },
            {
              group: ["@/features/*/*"],
              message:
                "Import across features only via the feature's public barrel (@/features/<domain>).",
            },
          ],
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // The API client is the one place allowed to import axios directly.
    files: ["src/lib/api/**/*.ts"],
    rules: { "no-restricted-imports": "off" },
  },
  {
    // The prototype is frozen reference code: it may import its own modules and
    // is not held to the current architectural rules. It never ships.
    files: ["src/_prototype/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": "off",
      "react-refresh/only-export-components": "off",
    },
  },
  {
    files: ["src/routes/**/*.tsx"],
    rules: {
      // The router intentionally lazy-imports the prototype behind a DEV guard.
      "no-restricted-imports": "off",
    },
  },
  {
    files: ["**/*.test.{ts,tsx}", "src/test/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  prettier,
]);
