# Architecture

## Overview

Client-only Angular app. No server, no accounts. Data flows between three places:

```
data file on the phone  <-- open / download -->  app (signals state)  <-- save / load -->  IndexedDB
```

- **Data file**: the user's JSON file. Source of truth for backups and moving between devices.
- **IndexedDB**: the working copy the app reads on start, so it works offline and without reopening the file.
- **Service worker**: caches the app shell and assets, so the app starts offline.

## Flows

**Open file**: the user picks a file with `<input type="file">` → `FileIoService` reads and validates the JSON → `FileStorageService` saves content and metadata (name, size, opened at) to IndexedDB → the home screen shows the stored file.

**Create new file**: `FileIoService` builds an empty data file (current schema version) → saves it to IndexedDB → offers a download (Blob + link, or Web Share on mobile).

**App start**: `FileStorageService` loads the stored file from IndexedDB, if any.

## Folder layout

```
src/app/
  core/
    storage/     FileStorageService (IndexedDB)
    file-io/     FileIoService (read, validate, download)
  features/
    home/        start screen
  shared/
    models/      data file types, schema version
```

Path aliases: `@core/*`, `@features/*`, `@shared/*`, `@app/*`, `@environments/*`.

## Offline and storage notes

- `navigator.storage.persist()` is requested on first save to reduce eviction.
- iOS may evict storage for non-installed sites; installing the PWA and exporting regularly mitigates this.
- Service workers need HTTPS (or localhost).
