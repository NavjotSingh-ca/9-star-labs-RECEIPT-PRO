// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // react-hook-form's watch() and TanStack Virtual's useVirtualizer() trigger
    // false-positive react-hooks/incompatible-library warnings — these APIs
    // are designed to return non-memoizable functions and work correctly.
    rules: {
      "react-hooks/incompatible-library": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    },
  },
  // Override default ignores of eslint-config-next.
  // NOTE: globalIgnores replaces (not extends) the next config's ignores,
  // so every path must be listed explicitly — including build artifacts
  // that would otherwise generate thousands of false warnings.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Build artifacts (compiled JS — not source):
    ".claude/**",
    "scripts/*.js",
    "storybook-static/**",
    "storybook-static/**",
    "playwright-report/**",
    "test-results/**",
    "coverage/**",
    // Tooling configs that ship their own (non-app) source:
    ".storybook/**",
    // Supabase Edge Functions run in Deno with their own toolchain;
    // they are not part of the Next.js app and are type-checked separately.
    "supabase/**",
  ]),
  ...storybook.configs["flat/recommended"],
  // Story files use Meta<any> for inferred component types and mock helpers
  // with `any[]` parameters — this is standard Storybook boilerplate and
  // does not indicate type-safety issues in application code.
  {
    files: ["**/*.stories.tsx", "**/*.stories.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
    },
  },
]);

export default eslintConfig;
