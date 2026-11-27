# Plan

## Goal

A personal spendings tracker as an Angular single page application, installable on the phone as a PWA. One JSON file acts as a portable database: the browser holds the live copy, the file is the backup and the way to move data between devices. No backend.

## Step 1 (current)

Scope:

- Open (upload) an existing data file from the phone and store it in browser storage.
- Create a new, empty data file and download it.
- Reopen the app offline and still see the stored file.
- Install the app to the home screen.

Out of scope: the real file structure, editing spendings, design.

Setup steps:

1. Create the Angular workspace (latest stable, standalone, strict, SCSS, routing, no SSR).
2. Add the Angular service worker (`@angular/pwa`); check install and offline start.
3. Apply code style and tooling ([CODE_STYLE.md](CODE_STYLE.md), [TOOLING.md](TOOLING.md)): ESLint, Prettier, EditorConfig, `.gitattributes`, Husky pre-commit and pre-push hooks, Vitest.
4. Add `FileStorageService` (IndexedDB) and `FileIoService` (open and download).
5. Build the home screen: "Open file", "Create new file", info about the stored file.
6. Unit tests for both services.
7. Deploy to a static HTTPS host and test on a real phone (Android Chrome, iOS Safari).

## Decisions

| Topic         | Decision                                                                         |
| ------------- | -------------------------------------------------------------------------------- |
| Framework     | Latest stable Angular, standalone components, signals, `inject()`                |
| PWA           | Angular service worker via `ng add @angular/pwa`                                 |
| Storage       | IndexedDB through the `idb` wrapper; `navigator.storage.persist()` on first save |
| Opening files | `<input type="file">` (File System Access API is not on iOS)                     |
| Saving files  | Blob download; Web Share API ("Save to Files") on mobile when available          |
| File format   | JSON with a `version` field (may change later)                                   |
| Line endings  | LF, enforced by `.gitattributes`                                                 |
| Tests         | Vitest, spec files for everything                                                |
| Workflow      | Branch, pull request, code review, merge                                         |

## Open questions

- Hosting: GitHub Pages suggested.

## Known limitations

iOS may clear browser storage for sites that are not installed and not used for a while. Installing the PWA and exporting the file regularly protects against it; the app will remind the user to export.
