import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';

import { DEFAULT_FILE_NAME, FileIoService, SpendingsFileError } from '@core/file-io';
import { FileStorageService } from '@core/storage';

import { SpendingsFile, StoredFile } from '@shared/models';

@Component({
  selector: 'app-home',
  imports: [DatePipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  protected readonly stored = signal<StoredFile | undefined>(undefined);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | undefined>(undefined);
  protected readonly spendingsCount = computed(() => this.stored()?.file.spendings.length ?? 0);

  private readonly fileIo = inject(FileIoService);
  private readonly storage = inject(FileStorageService);

  async ngOnInit(): Promise<void> {
    try {
      this.stored.set(await this.storage.load());
    } catch {
      this.error.set('Could not read the stored file from browser storage.');
    } finally {
      this.loading.set(false);
    }
  }

  async openFile(input: HTMLInputElement): Promise<void> {
    const picked = input.files?.[0];
    input.value = '';
    if (!picked) {
      return;
    }
    this.error.set(undefined);
    try {
      const file = await this.fileIo.readFile(picked);
      await this.store(file, picked.name, picked.size);
    } catch (error) {
      this.error.set(error instanceof SpendingsFileError ? error.message : 'Could not open the file.');
    }
  }

  async createNew(): Promise<void> {
    this.error.set(undefined);
    try {
      const file = this.fileIo.createEmpty();
      const size = new Blob([this.fileIo.serialize(file)]).size;
      await this.store(file, DEFAULT_FILE_NAME, size);
      await this.fileIo.download(file, DEFAULT_FILE_NAME);
    } catch {
      this.error.set('Could not create the file.');
    }
  }

  async download(): Promise<void> {
    const stored = this.stored();
    if (!stored) {
      return;
    }
    this.error.set(undefined);
    try {
      await this.fileIo.download(stored.file, stored.meta.name);
    } catch {
      this.error.set('Could not download the file.');
    }
  }

  private async store(file: SpendingsFile, name: string, size: number): Promise<void> {
    const meta = { name, size, savedAt: new Date().toISOString() };
    await this.storage.save(file, meta);
    this.stored.set({ file, meta });
  }
}
