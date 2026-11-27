import { TestBed } from '@angular/core/testing';

import { IDBFactory } from 'fake-indexeddb';
// Registers IDBRequest, IDBKeyRange etc. as globals, which idb needs.
import 'fake-indexeddb/auto';

import { SpendingsFile, StoredFileMeta } from '@shared/models';

import { FileStorageService } from './file-storage.service';

describe('FileStorageService', () => {
  const file: SpendingsFile = { spendings: [] };
  const meta: StoredFileMeta = { name: 'money-tracker.csv', size: 100, savedAt: '2026-11-27T17:00:00.000Z' };

  let service: FileStorageService;
  let persist: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
    persist = vi.fn().mockResolvedValue(true);
    Object.defineProperty(navigator, 'storage', { value: { persist }, configurable: true });
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileStorageService);
  });

  afterEach(() => {
    Reflect.deleteProperty(navigator, 'storage');
  });

  it('should return undefined when nothing is stored', async () => {
    expect(await service.load()).toBeUndefined();
  });

  it('should save and load the file with its metadata', async () => {
    await service.save(file, meta);

    expect(await service.load()).toEqual({ file, meta });
  });

  it('should replace the previously stored file', async () => {
    await service.save(file, meta);
    const newer: SpendingsFile = {
      spendings: [
        {
          date: '2024-02-03',
          account: 'Cash',
          category: 'Groceries',
          amount: -1,
          currency: 'EUR',
          convertedAmount: -1,
          convertedCurrency: 'EUR',
          description: '',
        },
      ],
    };
    await service.save(newer, { ...meta, name: 'other.csv' });

    expect(await service.load()).toEqual({ file: newer, meta: { ...meta, name: 'other.csv' } });
  });

  it('should clear the stored file', async () => {
    await service.save(file, meta);
    await service.clear();

    expect(await service.load()).toBeUndefined();
  });

  it('should request persistent storage only on the first save', async () => {
    await service.save(file, meta);
    await service.save(file, meta);

    expect(persist).toHaveBeenCalledTimes(1);
  });

  it('should save when the storage manager is not available', async () => {
    Reflect.deleteProperty(navigator, 'storage');

    await service.save(file, meta);

    expect(await service.load()).toEqual({ file, meta });
  });
});
