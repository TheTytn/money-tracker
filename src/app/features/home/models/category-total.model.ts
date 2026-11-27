/** Sum of one category's expenses in a month, in the main currency. */
export interface CategoryTotal {
  category: string;
  /** Positive amount spent. */
  amount: number;
  /** Share of the month's total, from 0 to 1. */
  share: number;
}
