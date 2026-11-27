// @ts-check
const eslint = require('@eslint/js');
const { defineConfig, globalIgnores } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const prettier = require('eslint-config-prettier/flat');
const unusedImports = require('eslint-plugin-unused-imports');

module.exports = defineConfig([
  globalIgnores(['**/dist/**', '**/node_modules/**', '**/assets/**']),
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
      prettier,
    ],
    plugins: {
      'unused-imports': unusedImports,
    },
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': ['warn', { type: 'attribute', prefix: 'app', style: 'camelCase' }],
      '@angular-eslint/component-selector': ['warn', { type: 'element', prefix: 'app', style: 'kebab-case' }],
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@angular-eslint/no-output-native': 'warn',
      '@angular-eslint/no-input-rename': 'warn',
      '@angular-eslint/no-output-on-prefix': 'warn',
      '@typescript-eslint/no-namespace': 'warn',
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility, prettier],
    rules: {
      '@angular-eslint/template/mouse-events-have-key-events': 'warn',
      '@angular-eslint/template/label-has-associated-control': 'warn',
      '@angular-eslint/template/click-events-have-key-events': 'warn',
      '@angular-eslint/template/interactive-supports-focus': 'warn',
      '@angular-eslint/template/alt-text': 'warn',
    },
  },
]);
