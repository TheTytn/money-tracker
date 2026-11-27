import { SpendingsFile } from './spendings-file.model';
import { StoredFileMeta } from './stored-file-meta.model';

/** A data file together with its metadata, as kept in browser storage. */
export interface StoredFile {
  file: SpendingsFile;
  meta: StoredFileMeta;
}
