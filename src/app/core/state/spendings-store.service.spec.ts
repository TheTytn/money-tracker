import { TestBed } from '@angular/core/testing';

import { FileIoService, SpendingsFileError, SpendingsFileErrorReason } from '@core/file-io';
import { FileStorageService } from '@core/storage';

import { Spending, SpendingsFile, StoredFile } from '@shared/models';

import { SpendingsStore } from './spendings-store.service';

describe('SpendingsStore', () => {
  const spending: Spending = {
    date: '2024-02-03',
    account: 'Cash',
    category: 'Groceries',
    amount: -12.5,
    currency: 'EUR',
    convertedAmount: -12.5,
    convertedCurrency: 'EUR',
    description: '',
  };
  const file: SpendingsFile = { spendings: [spending] };
  const stored: StoredFile = { file, meta: { name: 'mine.csv', size: 10, savedAt: '2026-11-27T17:00:00.000Z' } };

  let storage: { load: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn> };
  let fileIo: {
    readFile: ReturnType<typeof vi.fn>;
    createEmpty: ReturnType<typeof vi.fn>;
    serialize: ReturnType<typeof vi.fn>;
    download: ReturnType<typeof vi.fn>;
  };
  let store: SpendingsStore;

  beforeEach(() => {
    storage = { load: vi.fn().mockResolvedValue(stored), save: vi.fn().mockResolvedValue(undefined) };
    fileIo = {
      readFile: vi.fn().mockResolvedValue(file),
      createEmpty: vi.fn().mockReturnValue({ spendings: [] }),
      serialize: vi.fn().mockReturnValue('header\n'),
      download: vi.fn().mockResolvedValue(undefined),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: FileStorageService, useValue: storage },
        { provide: FileIoService, useValue: fileIo },
      ],
    });
    store = TestBed.inject(SpendingsStore);
  });

  it('should load the stored file once and expose its spendings', async () => {
    expect(store.loading()).toBe(true);

    await Promise.all([store.load(), store.load()]);

    expect(storage.load).toHaveBeenCalledTimes(1);
    expect(store.loading()).toBe(false);
    expect(store.stored()).toEqual(stored);
    expect(store.spendings()).toEqual([spending]);
  });

  it('should report a storage read failure', async () => {
    storage.load.mockRejectedValue(new Error('blocked'));

    await store.load();

    expect(store.error()).toContain('browser storage');
    expect(store.spendings()).toEqual([]);
  });

  it('should store an opened file', async () => {
    await store.open(new File(['x'], 'picked.csv'));

    expect(storage.save).toHaveBeenCalledWith(file, expect.objectContaining({ name: 'picked.csv', size: 1 }));
    expect(store.stored()?.meta.name).toBe('picked.csv');
  });

  it('should show the message of an invalid file and keep the stored file', async () => {
    await store.load();
    fileIo.readFile.mockRejectedValue(new SpendingsFileError(SpendingsFileErrorReason.InvalidRow, 'Line 2: bad.'));

    await store.open(new File(['x'], 'bad.csv'));

    expect(store.error()).toBe('Line 2: bad.');
    expect(store.stored()).toEqual(stored);
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('should create, store and download an empty file', async () => {
    await store.createNew();

    expect(storage.save).toHaveBeenCalledWith(
      { spendings: [] },
      expect.objectContaining({ name: 'money-tracker.csv' }),
    );
    expect(fileIo.download).toHaveBeenCalledWith({ spendings: [] }, 'money-tracker.csv');
    expect(store.spendings()).toEqual([]);
  });

  it('should download the stored file under its name', async () => {
    await store.load();

    await store.download();

    expect(fileIo.download).toHaveBeenCalledWith(file, 'mine.csv');
  });
});
