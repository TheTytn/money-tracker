# Tooling setup

Exact config files for formatting, linting, git hooks and tests. The rules they enforce are described in `docs/CODE_STYLE.md`.

## Summary

| Area | Setting |
|---|---|
| Formatter | Prettier 3 + `@trivago/prettier-plugin-sort-imports`; 120 cols, single quotes, trailing commas, semicolons, **LF**, `arrowParens: always`, `htmlWhitespaceSensitivity: ignore` |
| Import order | `@angular` → third party → `@core` → `@features` → `@shared` → `@app` → `@environments` → `rxjs` → relative; groups separated by a blank line, specifiers sorted |
| Linter | ESLint flat config: `@eslint/js` recommended, `typescript-eslint` recommended + stylistic, `angular-eslint` tsRecommended + templateRecommended + templateAccessibility, `eslint-config-prettier`, `eslint-plugin-unused-imports` |
| Key lint rules | unused imports = error; unused vars error unless prefixed `_`; `no-explicit-any` warn; selectors `app-` kebab / `app` camelCase; a11y template rules as warnings; `prefer-standalone` and `prefer-inject` **on** (defaults) |
| Line endings | LF, enforced by `.gitattributes` so editing on Windows never changes line endings in commits |
| EditorConfig | UTF-8, 2 spaces, LF, final newline, trim trailing whitespace, single quotes in `.ts` |
| TypeScript | `strict: true` with `strictPropertyInitialization: false`; `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch`; Angular `strictTemplates`, `strictInjectionParameters`, `strictInputAccessModifiers` |
| Tests | Vitest (Angular CLI default); spec files generated for every schematic |
| Git hooks | Husky + lint-staged at the repo root. `pre-commit`: `eslint --fix` + `prettier --write` on staged files. `pre-push`: lint, Prettier check, unit tests |
| Stylelint | Not used |

### `.gitattributes`
```
* text=auto eol=lf
*.png binary
*.jpg binary
*.ico binary
*.woff binary
*.woff2 binary
```
On Windows also run once: `git config core.autocrlf false`, so Git does not convert files to CRLF on checkout.

### `.editorconfig`
```ini
# Editor configuration, see https://editorconfig.org
root = true

[*]
charset = utf-8
indent_style = space
indent_size = 2
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true

[*.ts]
quote_type = single

[*.md]
max_line_length = off
trim_trailing_whitespace = false
```

### `.prettierrc.json`
```json
{
  "trailingComma": "all",
  "tabWidth": 2,
  "semi": true,
  "singleQuote": true,
  "bracketSameLine": false,
  "htmlWhitespaceSensitivity": "ignore",
  "printWidth": 120,
  "bracketSpacing": true,
  "endOfLine": "lf",
  "arrowParens": "always",
  "importOrderParserPlugins": ["typescript", "decorators-legacy"],
  "plugins": ["@trivago/prettier-plugin-sort-imports"],
  "importOrder": [
    "^@angular/(.*)$",
    "<THIRD_PARTY_MODULES>",

    "^@core/(.*)$",
    "^@features/(.*)$",
    "^@shared/(.*)$",
    "^@app/(.*)$",
    "^@environments/(.*)$",
    "^rxjs$",
    "^rxjs/(.*)$",

    "^[./]"
  ],
  "importOrderSeparation": true,
  "importOrderSortSpecifiers": true
}
```

### `.prettierignore`
```
# Ignore path
**/node_modules/
**/.angular
**/src/assets/
**/.vscode/
**/dist/
# Ignore all files with extension:
*.woff2
*.woff
*.png
*.gitkeep
*.gitignore
*.browserslistrc
*.editorconfig
*.prettierignore
*.ico
**/docker/
**/Dockerfile
```

### `eslint.config.js`
```js
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
```

### `tsconfig.json` compiler and Angular options
```json
{
  "compileOnSave": false,
  "compilerOptions": {
    "outDir": "./dist/out-tsc",
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "strict": true,
    "strictPropertyInitialization": false,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "sourceMap": true,
    "declaration": true,
    "experimentalDecorators": true,
    "moduleResolution": "bundler",
    "importHelpers": true,
    "target": "ES2022",
    "module": "ES2022",
    "useDefineForClassFields": false,
    "paths": {
      "@src/*": ["./src/*"],
      "@app/*": ["./src/app/*"],
      "@core/*": ["./src/app/core/*"],
      "@shared/*": ["./src/app/shared/*"],
      "@features/*": ["./src/app/features/*"],
      "@environments/*": ["./src/environments/*"]
    }
  },
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true
  }
}
```
Keep the CLI-generated `target`, `module`, `useDefineForClassFields` and `references` layout; merge in the strictness flags and `paths` above.

### `angular.json` pieces
Inside the project:
```json
"schematics": {
  "@schematics/angular:component": { "style": "scss" }
},
"prefix": "app",
```
Spec files stay on (no `skipTests`). In `architect.build.options`: `"inlineStyleLanguage": "scss"`, `"styles": ["src/styles.scss"]`.
Lint target:
```json
"lint": {
  "builder": "@angular-eslint/builder:lint",
  "options": { "lintFilePatterns": ["src/**/*.ts", "src/**/*.html"] }
}
```
Top level:
```json
"cli": { "analytics": false, "schematicCollections": ["angular-eslint"] },
"schematics": {
  "@schematics/angular:component": { "type": "component" },
  "@schematics/angular:directive": { "type": "directive" },
  "@schematics/angular:service": { "type": "service" },
  "@schematics/angular:guard": { "typeSeparator": "." },
  "@schematics/angular:interceptor": { "typeSeparator": "." },
  "@schematics/angular:pipe": { "typeSeparator": "." },
  "@schematics/angular:resolver": { "typeSeparator": "." }
}
```
This keeps file names like `foo.component.ts`, `foo.service.ts`, `foo.guard.ts`.

Budgets: initial 500kb warn / 1mb error; anyComponentStyle 2kb warn / 10kb error.

### `package.json` pieces
`package.json` sits at the repository root, next to `.git`, so Husky hooks actually run.
```json
"scripts": {
  "ng": "ng",
  "start": "ng serve",
  "build": "ng build",
  "watch": "ng build --watch --configuration development",
  "test": "ng test",
  "test:ci": "ng test --watch=false",
  "lint": "ng lint",
  "format:check": "prettier --check .",
  "prepare": "husky"
},
"lint-staged": {
  "**/*": ["eslint --fix", "prettier --write --ignore-unknown"]
}
```
Dev dependencies: `@eslint/js`, `eslint`, `typescript-eslint`, `angular-eslint`, `eslint-config-prettier`, `eslint-plugin-unused-imports`, `prettier`, `@trivago/prettier-plugin-sort-imports`, `husky`, `lint-staged` (latest versions at setup). Easiest path: `ng add angular-eslint`, then `npm i -D` the rest.

### `.husky/pre-commit`
```
npx lint-staged
```

### `.husky/pre-push`
```
npm run lint
npm run format:check
npm run test:ci
```

## Code review

Changes go through a pull request, and each PR gets a code review before it is merged into `main`. The pre-push hook catches lint, format and test failures before the code leaves the machine.
