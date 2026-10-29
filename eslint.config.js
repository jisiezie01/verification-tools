import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
	{
		ignores: ["dist/**", "node_modules/**", "build/**"],
	},
	{
		files: ["**/*.{ts,tsx}"],
		extends: [js.configs.recommended, ...tseslint.configs.recommended],
		languageOptions: {
			ecmaVersion: 2020,
			globals: globals.browser,
		},
		plugins: {
			"react-hooks": reactHooks,
			"react-refresh": reactRefresh,
		},
		rules: {
			// ===================================
			// Relaxed rules for existing codebase
			// ===================================

			// JavaScript rules
			"no-unused-vars": "off",
			"prefer-const": "off",

			// TypeScript rules - relaxed but helpful
			"@typescript-eslint/no-unused-vars": "off",
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/ban-ts-comment": "off",
			"@typescript-eslint/no-non-null-assertion": "off",
			"@typescript-eslint/no-empty-function": "off",
			"@typescript-eslint/no-empty-interface": "off",
			"@typescript-eslint/no-var-requires": "off",
			"@typescript-eslint/no-inferrable-types": "off",
			"@typescript-eslint/ban-types": "off",
			"@typescript-eslint/no-namespace": "off",
			"@typescript-eslint/no-empty-object-type": "off",
			"@typescript-eslint/no-require-imports": "off",

			// React hooks rules - keep these on for quality
			"react-hooks/rules-of-hooks": "error",
			"react-hooks/exhaustive-deps": "warn",

			// React refresh - warn only
			"react-refresh/only-export-components": "warn",
		},
	},
);
