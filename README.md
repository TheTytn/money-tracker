# Money Tracker

A personal spendings tracker that runs as an installable, offline-first Progressive Web App on your phone.

All data lives in one CSV file that you own, in the same layout as a Monefy export. The app opens that file from your phone, keeps a working copy in browser storage (IndexedDB), and exports it back as a file. It works the same offline and online, and there is no backend.

## Status

Step 1: project setup, PWA, open a data file and store it, create a new data file and download it. See [docs/PLAN.md](docs/PLAN.md).

## Requirements

- Node.js 20.19+ (Node 24 LTS recommended)
- npm 10+

## Getting started

```bash
npm install
npm start          # dev server at http://localhost:4200
```

## Scripts

| Command                | What it does                      |
| ---------------------- | --------------------------------- |
| `npm start`            | Run the dev server                |
| `npm run build`        | Production build into `dist/`     |
| `npm test`             | Unit tests (Vitest) in watch mode |
| `npm run test:ci`      | Unit tests once                   |
| `npm run lint`         | ESLint                            |
| `npm run format:check` | Prettier check                    |

Git hooks run automatically: pre-commit fixes and formats staged files, pre-push runs lint, the format check and tests.

## Testing the PWA

The service worker only runs in a production build served over HTTP(S):

```bash
npm run build
npx http-server dist/money-tracker/browser -p 8080
```

Open http://localhost:8080, then check offline mode in DevTools, or install the app from the browser menu.

## Deployment

Every push to `main` is built and deployed to GitHub Pages by [.github/workflows/deploy.yml](.github/workflows/deploy.yml): https://thetytn.github.io/money-tracker/

Pull requests run the same lint, format, test and build steps without deploying.

## Documentation

- [Plan](docs/PLAN.md): milestones and setup steps
- [Features](docs/FEATURES.md): feature list
- [Architecture](docs/ARCHITECTURE.md): storage, file flow, offline behaviour, folder layout
- [Data format](docs/DATA_FORMAT.md): structure of the data file
- [Code style](docs/CODE_STYLE.md): coding rules
- [Tooling](docs/TOOLING.md): exact lint, format, test and git hook configs

## Contributing

Work on a branch, open a pull request into `main`, and get a code review before merge. Line endings are LF everywhere; on Windows run `git config core.autocrlf false` once in this repo.
