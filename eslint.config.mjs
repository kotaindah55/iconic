import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all
});

export default [{
	ignores: [
		"**/@external",
		"**/node_modules/",
		"**/main.js",
		"**/.deprecated/",
		"**/esbuild.config.mjs",
		"**/eslint.config.mjs",
		"**/libs/"
	],
}, ...compat.extends(
	"eslint:recommended",
	"plugin:@typescript-eslint/eslint-recommended",
	"plugin:@typescript-eslint/recommended",
), {
	plugins: {
		"@typescript-eslint": typescriptEslint,
	},

	languageOptions: {
		globals: {
			...globals.node,
		},

		parser: tsParser,
		ecmaVersion: 6,
		sourceType: "module",
	},

	rules: {
		"no-unused-vars": "off",
		"@typescript-eslint/no-unused-vars": ["error", {
			args: "none",
		}],
		"@typescript-eslint/ban-ts-comment": "off",
		"no-prototype-builtins": "off",
		"@typescript-eslint/no-empty-function": "off",
		"prefer-const": "off",
		"no-cond-assign": "off",
		"no-unused-labels": "off"
	},
}];