# Money Tracker

Offline-first Angular PWA for tracking personal spendings. Data lives in a user-owned JSON file, with a working copy in IndexedDB. No backend.

- Plan and scope: @docs/PLAN.md
- Architecture: @docs/ARCHITECTURE.md
- Code style (follow it): @docs/CODE_STYLE.md
- Tooling configs: @docs/TOOLING.md
- Data file format: @docs/DATA_FORMAT.md

Rules:
- Standalone components, signals, `inject()`. No NgModules.
- Every new component, service, pipe, directive or guard gets a spec file.
- Before pushing: `npm run lint`, `npm run format:check`, `npm run test:ci`, `npm run build` must pass.
- LF line endings only.
- Changes go through a pull request with a code review.
