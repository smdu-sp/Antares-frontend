import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "@typescript-eslint/eslint-plugin/use-at-your-own-risk/raw-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const tsRecommended = tseslint.flatConfigs["flat/recommended"].map(
  (config) => ({
    ...config,
    files: ["**/*.ts", "**/*.tsx"],
  }),
);

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  ...tsRecommended,
  {
    rules: {
      "prefer-const": "off",
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
];

export default eslintConfig;
