/** One row of the data file. See docs/DATA_FORMAT.md. */
export interface Spending {
  /** Calendar date as `yyyy-MM-dd`. */
  date: string;
  account: string;
  category: string;
  /** Negative for expenses, positive for income. */
  amount: number;
  currency: string;
  /** Amount in the main currency. */
  convertedAmount: number;
  convertedCurrency: string;
  description: string;
}
