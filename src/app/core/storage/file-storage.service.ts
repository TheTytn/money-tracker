import { Injectable } from '@angular/core';

import { DBSchema, IDBPDatabase, openDB } from 'idb';

import { SpendingsFile, StoredFile, StoredFileMeta } from '@shared/models';

const DB_NAME = 'money-tracker';
const DB_VERSION = 1;
const STORE_NAME = 'files';
const CURRENT_KEY = 'current';

interface MoneyTrackerDb extends DBSchema {
  [STORE_NAME]: {
    key: string;
    value: StoredFile;
  };
}

/** Keeps the working copy of the data file in IndexedDB. */
@Injectable({ providedIn: 'root' })
export class FileStorageService {
  private dbPromise?: Promise<IDBPDatabase<MoneyTrackerDb>>;
  private persistRequested = false;

  async save(file: SpendingsFile, meta: StoredFileMeta): Promise<void> {
    await this.requestPersistentStorage();
    const db = await this.getDb();
    await db.put(STORE_NAME, { file, meta }, CURRENT_KEY);
  }

  async load(): Promise<StoredFile | undefined> {
    const db = await this.getDb();
    return db.get(STORE_NAME, CURRENT_KEY);
  }

  async clear(): Promise<void> {
    const db = await this.getDb();
    await db.delete(STORE_NAME, CURRENT_KEY);
  }

  private getDb(): Promise<IDBPDatabase<MoneyTrackerDb>> {
    this.dbPromise ??= openDB<MoneyTrackerDb>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
    return this.dbPromise;
  }

  /** Asks the browser not to evict our storage. Only done once, on the first save. */
  private async requestPersistentStorage(): Promise<void> {
    if (this.persistRequested) {
      return;
    }
    this.persistRequested = true;
    if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
      await navigator.storage.persist();
    }
  }
}
