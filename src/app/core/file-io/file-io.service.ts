import { DOCUMENT, Injectable, inject } from '@angular/core';

import { SpendingsFile } from '@shared/models';

import { parseSpendingsCsv, serializeSpendingsCsv } from './spendings-csv';
import { SpendingsFileError, SpendingsFileErrorReason } from './spendings-file-error';

export const DEFAULT_FILE_NAME = 'money-tracker.csv';
const CSV_MIME_TYPE = 'text/csv';
/** Byte order mark, so spreadsheet apps detect UTF-8 (Cyrillic text stays readable). */
const UTF8_BOM = '\uFEFF';
/** Fallback for files that are not UTF-8, e.g. exports made with a Cyrillic Windows locale. */
const LEGACY_ENCODING = 'windows-1251';

/** Reads, validates, creates and downloads CSV data files. */
@Injectable({ providedIn: 'root' })
export class FileIoService {
  private readonly document = inject(DOCUMENT);

  async readFile(file: File): Promise<SpendingsFile> {
    const text = this.decode(await file.arrayBuffer());
    return { spendings: parseSpendingsCsv(text) };
  }

  createEmpty(): SpendingsFile {
    return { spendings: [] };
  }

  serialize(file: SpendingsFile): string {
    return UTF8_BOM + serializeSpendingsCsv(file.spendings);
  }

  /** Saves the file to the device: Web Share ("Save to Files") when supported, otherwise a download link. */
  async download(file: SpendingsFile, fileName = DEFAULT_FILE_NAME): Promise<void> {
    const content = this.serialize(file);
    const nav = this.document.defaultView?.navigator;
    const shareFile = new File([content], fileName, { type: CSV_MIME_TYPE });

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

    const url = URL.createObjectURL(new Blob([content], { type: CSV_MIME_TYPE }));
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

  /** UTF-8 (with or without BOM) first; files that aren't valid UTF-8 are read as Windows-1251. */
  private decode(buffer: ArrayBuffer): string {
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch {
      try {
        return new TextDecoder(LEGACY_ENCODING).decode(buffer);
      } catch {
        throw new SpendingsFileError(
          SpendingsFileErrorReason.UnsupportedEncoding,
          'The file is not UTF-8 and this browser cannot read Windows-1251.',
        );
      }
    }
  }
}
