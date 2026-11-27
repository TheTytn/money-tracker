# Architecture

## Overview

Client-only Angular app. No server, no accounts. Data flows between three places:

```
data file on the phone  <-- open / download -->  app (signals state)  <-- save / load -->  IndexedDB
```

- **Data file**: the user's CSV file (Monefy export layout). Source of truth for backups and moving between devices.
- **IndexedDB**: the working copy the app reads on start, so it works offline and without reopening the file.
- **Service worker**: caches the app shell and assets, so the app starts offline.

## Flows

**Open file**: the user picks a file with `<input type="file">` → `FileIoService` decodes the file (UTF-8, or Windows-1251 as a fallback) and parses the CSV → `FileStorageService` saves content and metadata (name, size, opened at) to IndexedDB → the home screen shows the stored file.

**Create new file**: `FileIoService` builds an empty data file (header row only) → saves it to IndexedDB → offers a download (Blob + link, or Web Share on mobile).

**App start**: an app initializer calls `SpendingsStore.load()`, which reads the stored file from IndexedDB, if any.

**State**: `SpendingsStore` (`@core/state`) is the single place components read from: `stored()`, `loading()`, `error()`, `spendings()`, plus `open()`, `createNew()` and `download()`.

## Folder layout

```
src/app/
  core/
    storage/     FileStorageService (IndexedDB)
    file-io/     FileIoService (read, validate, download), CSV parser and writer
    state/       SpendingsStore (signals with the current file)
  features/
    home/        start screen
  shared/
    models/      Spending, SpendingsFile, stored file metadata
```

Path aliases: `@core/*`, `@features/*`, `@shared/*`, `@app/*`, `@environments/*`.

## Offline and storage notes

- `navigator.storage.persist()` is requested on first save to reduce eviction.
- iOS may evict storage for non-installed sites; installing the PWA and exporting regularly mitigates this.
- Service workers need HTTPS (or localhost).
