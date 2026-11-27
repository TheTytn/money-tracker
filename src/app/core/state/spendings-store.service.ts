import { Injectable, computed, inject, signal } from '@angular/core';

import { DEFAULT_FILE_NAME, FileIoService, SpendingsFileError } from '@core/file-io';
import { FileStorageService } from '@core/storage';

import { Spending, SpendingsFile, StoredFile } from '@shared/models';

/** App-wide state of the current data file: what's stored, plus open, create and download actions. */
@Injectable({ providedIn: 'root' })
export class SpendingsStore {
  private readonly fileIo = inject(FileIoService);
  private readonly storage = inject(FileStorageService);

  private readonly storedState = signal<StoredFile | undefined>(undefined);
  private readonly loadingState = signal(true);
  private readonly errorState = signal<string | undefined>(undefined);
  private loadPromise?: Promise<void>;

  readonly stored = this.storedState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly spendings = computed<Spending[]>(() => this.storedState()?.file.spendings ?? []);

  /** Loads the stored file from browser storage. Runs once; later calls return the same promise. */
  load(): Promise<void> {
    this.loadPromise ??= this.loadFromStorage();
    return this.loadPromise;
  }

  async open(picked: File): Promise<void> {
    this.errorState.set(undefined);
    try {
      const file = await this.fileIo.readFile(picked);
      await this.store(file, picked.name, picked.size);
    } catch (error) {
      this.errorState.set(error instanceof SpendingsFileError ? error.message : 'Could not open the file.');
    }
  }

  async createNew(): Promise<void> {
    this.errorState.set(undefined);
    try {
      const file = this.fileIo.createEmpty();
      const size = new Blob([this.fileIo.serialize(file)]).size;
      await this.store(file, DEFAULT_FILE_NAME, size);
      await this.fileIo.download(file, DEFAULT_FILE_NAME);
    } catch {
      this.errorState.set('Could not create the file.');
    }
  }

  async download(): Promise<void> {
    const stored = this.storedState();
    if (!stored) {
      return;
    }
    this.errorState.set(undefined);
    try {
      await this.fileIo.download(stored.file, stored.meta.name);
    } catch {
      this.errorState.set('Could not download the file.');
    }
  }

  private async loadFromStorage(): Promise<void> {
    try {
      this.storedState.set(await this.storage.load());
    } catch {
      this.errorState.set('Could not read the stored file from browser storage.');
    } finally {
      this.loadingState.set(false);
    }
  }

  private async store(file: SpendingsFile, name: string, size: number): Promise<void> {
    const meta = { name, size, savedAt: new Date().toISOString() };
    await this.storage.save(file, meta);
    this.storedState.set({ file, meta });
  }
}
