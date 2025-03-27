// @ts-check

import tseslint from 'typescript-eslint';
import pluginJs from '@eslint/js';
import globals from 'globals';
import eslintPluginPromise from 'eslint-plugin-promise';
import eslintPluginImport from 'eslint-plugin-import';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

export default tseslint.config(
  {
    ignores: ['node_modules', 'dist', 'coverage', 'jest.config.mjs'],
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPromise.configs['flat/recommended'],
  {
    files: ['**/*.{ts}'],

    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ['./tsconfig.json'],
        sourceType: 'module',
        projectService: true,
        tsconfigRootDir: __dirname,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node },
    },

    plugins: {
      '@typescript-eslint': tseslint.plugin,
      prettier: eslintPluginPrettier,
      import: eslintPluginImport,
    },

    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './typescript',
        },
        alias: {
          map: [['@', './src']],
          extensions: ['.ts', '.js', '.mjs', '.json'],
        },
      },
    },

    rules: {
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          parser: 'flow',
        },
      ],
      'prettier-eslint/prettier': 'warn',
      'no-unused-vars': 'off',
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
  eslintConfigPrettier,
  eslintPluginPrettierRecommended
);
