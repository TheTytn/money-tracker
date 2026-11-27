# Frontend Code Style — Angular / TypeScript

General code style rules for this Angular app. Referenced from `CLAUDE.md`. Exact tool configs are in [TOOLING.md](TOOLING.md).

## 1. Tooling (enforced, not optional)

- **Prettier** formats everything; **ESLint** (`angular-eslint`, `typescript-eslint`) lints. Never hand-format against them.
- Pre-commit hook: Husky + `lint-staged` → `eslint --fix` then `prettier --write` on staged files.
- Pre-push hook: lint, Prettier check and unit tests must pass before anything is pushed.
- Line endings are LF everywhere, enforced by `.gitattributes` (`* text=auto eol=lf`) and Prettier `endOfLine: "lf"`.
- Recommended `.prettierrc.json`:
  ```json
  {
    "printWidth": 120,
    "tabWidth": 2,
    "semi": true,
    "singleQuote": true,
    "trailingComma": "all",
    "arrowParens": "always",
    "bracketSpacing": true,
    "bracketSameLine": false,
    "htmlWhitespaceSensitivity": "ignore",
    "plugins": ["@trivago/prettier-plugin-sort-imports"],
    "importOrderParserPlugins": ["typescript", "decorators-legacy"],
    "importOrderSeparation": true,
    "importOrderSortSpecifiers": true,
    "importOrder": [
      "^@angular/(.*)$",
      "<THIRD_PARTY_MODULES>",
      "^@core/(.*)$",
      "^@features/(.*)$",
      "^@shared/(.*)$",
      "^@app/(.*)$",
      "^rxjs$",
      "^rxjs/(.*)$",
      "^[./]"
    ]
  }
  ```
  Add each new path alias to `importOrder`. The full file is in [TOOLING.md](TOOLING.md).
- `.editorconfig`: UTF-8, 2 spaces, final newline, trim trailing whitespace, single quotes in `.ts`.
- ESLint essentials: `unused-imports/no-unused-imports: error`, unused vars must start with `_`, `@typescript-eslint/no-explicit-any: warn`, component selector `app-*` kebab-case, directive selector `app*` camelCase, accessibility rules on templates.

## 2. TypeScript

- `strict: true`, plus `noImplicitReturns`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `forceConsistentCasingInFileNames`. Angular `strictTemplates: true`.
- No `any`; use `unknown` and narrow, or a proper type. Where unavoidable, add a comment.
- Prefer `interface` for object shapes (models, DTOs), `type` for unions/utility types.
- `const` by default, `let` only when reassigned, never `var`.
- Explicit return types on public methods when inference is not obvious; explicit types on exported members.
- Use `readonly` for injected dependencies and constants.
- Prefer `async/await` or RxJS — don't mix styles in one function.
- Enums: string-valued enums or `as const` objects; derive key types with `keyof typeof`. Never use magic strings for domain values.
- Optional chaining (`?.`) and nullish coalescing (`??`) over manual checks.
- Dates: `date-fns` (or similar); treat server times as UTC.

## 3. Naming & files

| Item                       | Style                                | Example                                                                                                                                 |
| -------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| File                       | `kebab-case.<type>.ts`               | `spending-list.component.ts`, `spending.service.ts`, `category-type.enum.ts`, `unsaved-changes.guard.ts`, `spending-detail.resolver.ts` |
| Class                      | `PascalCase` + suffix                | `SpendingListComponent`, `SpendingService`, `UnsavedChangesGuard`                                                                       |
| Interface / type           | `PascalCase`, **no** `I` prefix      | `SpendingDetail`, `PagedList<T>`                                                                                                        |
| Variable, method, property | `camelCase`                          | `currentView`                                                                                                                           |
| Constant                   | `UPPER_SNAKE_CASE`                   | `TABLE_ROWS`                                                                                                                            |
| Observable                 | `name$` (optional but be consistent) | `spendings$`                                                                                                                            |
| Selector                   | `app-kebab-case`                     | `app-spending-list`                                                                                                                     |

- One component/service/pipe/directive per file. Template, styles and spec are siblings with the same base name.
- Don't abbreviate; names say what the thing is.

## 4. Project structure

```
src/app/
  core/      singleton infrastructure: auth, guards, interceptors, layout, store, utils — imported once
  shared/    reusable components, directives, pipes, enums, constants, models, helpers
  features/
    <feature>/
      <feature>.routes.ts
      components/  services/  models/  enums/  guards/  resolvers/   (each with index.ts barrel)
```

- Standalone components only, no NgModules. Features are lazy-loaded through `loadComponent` / `loadChildren` routes and never import each other's internals — share via `shared/` or `core/`.
- **Barrel files** (`index.ts`) in each folder; import from the barrel.
- **Path aliases** (`@core/*`, `@features/*`, `@shared/*`) instead of deep relative paths. Relative imports only within the same folder/feature.
- Keep files small: if a component exceeds ~300 lines, extract child components or services.

## 5. Components

- Declare `selector`, `templateUrl`, `styleUrls` (or `styleUrl`); use `host: { class: '…' }` instead of `@HostBinding` for static classes.
- All components, directives and pipes are standalone (the default; don't write `standalone: true`). Lint enforces `prefer-standalone`.
- Class member order: `@Input`/`@Output`/`@ViewChild` → public fields → private fields → getters → constructor/`inject` → lifecycle hooks (in lifecycle order) → public methods → private methods.
- Inject dependencies with `inject()` in field initialisers (`private readonly x = inject(X);`), not constructor parameters. Lint enforces `prefer-inject`. Logic goes in `ngOnInit`, not field initialisers.
- Components handle presentation; business/data logic goes in services.
- Prefer `ChangeDetectionStrategy.OnPush` for new components and immutable inputs.
- Use signals (`signal`, `computed`, `input()`, `output()`) for component state and inputs/outputs.
- Always unsubscribe: `async` pipe, `takeUntilDestroyed`, `take(1)`/`firstValueFrom`, or a destroy subject. No bare long-lived `subscribe` without cleanup.

## 6. Templates

- Use built-in control flow (`@if`, `@for` with `track`, `@switch`).
- No logic beyond trivial expressions in templates; no function calls that do work (use getters, pipes, or signals/`computed`).
- All user-visible text goes through the i18n layer (`translate` pipe / `TranslateService`). No hard-coded strings.
- Accessibility: `alt` on images, labels bound to controls, keyboard handlers with click handlers, `aria-label` on icon-only buttons.
- Prefer `[class.x]` / `[ngClass]` over string-built class names; avoid inline `style`.

## 7. Services, HTTP & state

- `@Injectable` services with `providedIn: 'root'` for app-wide, or provided in the feature's route `providers` for feature-scoped ones.
- Services own URLs (built from `environment.apiUrl`), return `Observable<T>`, and do no UI work.
- Typed responses: `this.http.get<SpendingDetail>(url)`. Models are interfaces in `models/`; keep them in sync with the API contract.
- Cross-cutting error handling, auth headers and loading indicators belong in **interceptors**, not in each call.
- Route-level data via **resolvers**; access control via **guards**.
- State: NgRx for shared/global state (actions → reducer → effects → selectors); local component state stays local. Don't duplicate server data in multiple places.
- Forms: Reactive Forms with typed `FormGroup`/`FormControl`; validators in reusable functions.

## 8. Styling (SCSS)

- Component-scoped styles in the component's `.scss`; global styles only for theme, resets and utilities.
- Use the UI library's utility/flex classes and theme tokens (CSS variables) before writing custom CSS.
- BEM-ish, lowercase-kebab class names; max 3 levels of nesting; no `!important` unless overriding a third-party style (comment why).
- Never use `::ng-deep` without a scoped parent selector.

## 9. Error handling & logging

- Handle errors in one place (interceptor + global error handler) and show user-friendly translated messages through a shared message service.
- Use the logger service (`NGXLogger` or similar), not `console.log`. No debug logs in committed code.
- Never log tokens, PII or full response bodies.

## 10. Security

- Auth through the OIDC client + guards; UI permission checks are for UX only — the server is the authority.
- Never use `innerHTML` with unsanitised content; rely on Angular sanitisation, and review any `bypassSecurityTrust*`.
- No secrets in the bundle; environment-specific values come from `environment.*` / runtime config.

## 11. Testing

- Vitest (Angular CLI default) via `ng test`. Spec files are generated for every component, service, pipe, directive and guard.
- Spec file next to the source: `spending.service.spec.ts`.
- Test behaviour, not implementation; mock HTTP with `HttpTestingController`.
- `describe('<Unit>')` → `it('should …')`.

## 12. Commits & PRs

- Conventional Commits: `type(scope): imperative lowercase summary`, e.g. `feat(storage): save opened file to indexeddb`.
- The pre-push hook runs lint, format check and tests; also run `npm run build` before opening a PR. Keep PRs focused, and every PR gets a code review before merge.
