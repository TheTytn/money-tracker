/** Content of the user's data file. See docs/DATA_FORMAT.md. */
export interface SpendingsFile {
  version: number;
  createdAt: string;
  updatedAt: string;
  spendings: unknown[];
}
