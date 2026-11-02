import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';

export default defineConfig([
  globalIgnores([
    'assets/*',
    '!assets/js/',
    'assets/js/*',
    '!assets/js/atlas/',
    'node_modules/*',
    '_site/*',
    'work/*',
    '.agents/**',
    '.hallmark/**',
    'vendor/*'
  ]),
  js.configs.recommended,
  {
    rules: {
      semi: ['error', 'always'],
      quotes: ['error', 'single']
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.worker
      }
    }
  },
  {
    // Retain the existing campus test suite’s quote style without changing tests.
    files: ['tests/campus-browser.mjs'],
    rules: { quotes: ['error', 'double', { avoidEscape: true }] }
  },
  {
    files: ['_javascript/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
        ClipboardJS: 'readonly',
        GLightbox: 'readonly',
        Theme: 'readonly',
        dayjs: 'readonly',
        mermaid: 'readonly',
        tocbot: 'readonly',
        swconf: 'readonly'
      }
    }
  }
]);
