import { DOCUMENT, Injectable, inject } from '@angular/core';

import { CURRENT_SCHEMA_VERSION, SpendingsFile } from '@shared/models';

import { SpendingsFileError, SpendingsFileErrorReason } from './spendings-file-error';

export const DEFAULT_FILE_NAME = 'money-tracker.json';
const JSON_MIME_TYPE = 'application/json';

/** Reads, validates, creates and downloads data files. */
@Injectable({ providedIn: 'root' })
export class FileIoService {
  private readonly document = inject(DOCUMENT);

  async readFile(file: File): Promise<SpendingsFile> {
    const text = await file.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      throw new SpendingsFileError(SpendingsFileErrorReason.InvalidJson, 'The file is not valid JSON.');
    }
    if (!this.isSpendingsFile(data)) {
      throw new SpendingsFileError(
        SpendingsFileErrorReason.InvalidStructure,
        'The file is not a Money Tracker data file: it needs a numeric "version" and a "spendings" list.',
      );
    }
    return data;
  }

  createEmpty(): SpendingsFile {
    const now = new Date().toISOString();
    return { version: CURRENT_SCHEMA_VERSION, createdAt: now, updatedAt: now, spendings: [] };
  }

  serialize(file: SpendingsFile): string {
    return JSON.stringify(file, null, 2);
  }

  /** Saves the file to the device: Web Share ("Save to Files") when supported, otherwise a download link. */
  async download(file: SpendingsFile, fileName = DEFAULT_FILE_NAME): Promise<void> {
    const content = this.serialize(file);
    const nav = this.document.defaultView?.navigator;
    const shareFile = new File([content], fileName, { type: JSON_MIME_TYPE });

    if (nav?.canShare?.({ files: [shareFile] })) {
      try {
        await nav.share({ files: [shareFile], title: fileName });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        throw error;
      }
      return;
    }

    const url = URL.createObjectURL(new Blob([content], { type: JSON_MIME_TYPE }));
    const anchor = this.document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.style.display = 'none';
    this.document.body.appendChild(anchor);
    try {
      anchor.click();
    } finally {
      anchor.remove();
      URL.revokeObjectURL(url);
    }
  }

  private isSpendingsFile(data: unknown): data is SpendingsFile {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      return false;
    }
    const candidate = data as Partial<Record<keyof SpendingsFile, unknown>>;
    return typeof candidate.version === 'number' && Array.isArray(candidate.spendings);
  }
}
