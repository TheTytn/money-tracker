import { Spending } from './spending.model';

/** Content of the user's CSV data file. See docs/DATA_FORMAT.md. */
export interface SpendingsFile {
  spendings: Spending[];
}
