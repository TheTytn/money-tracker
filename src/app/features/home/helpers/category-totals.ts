import { isTransferOrBalance } from '@shared/helpers';
import { Spending } from '@shared/models';

import { CategoryTotal } from '../models';

/** Label for the slice that groups the smallest categories. */
export const OTHER_CATEGORIES_LABEL = 'Other';

/**
 * Expenses of one `yyyy-MM` month grouped by category, largest first, in the main currency.
 * Transfers, initial balances and income are left out. Beyond `maxSlices`, the rest is merged into "Other".
 */
export function categoryTotals(spendings: readonly Spending[], month: string, maxSlices = 8): CategoryTotal[] {
  const sums = new Map<string, number>();
  for (const spending of spendings) {
    if (spending.convertedAmount < 0 && spending.date.startsWith(month) && !isTransferOrBalance(spending.category)) {
      sums.set(spending.category, (sums.get(spending.category) ?? 0) - spending.convertedAmount);
    }
  }

  const sorted = [...sums].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
  const grouped =
    sorted.length > maxSlices
      ? [
          ...sorted.slice(0, maxSlices - 1),
          {
            category: OTHER_CATEGORIES_LABEL,
            amount: sorted.slice(maxSlices - 1).reduce((sum, item) => sum + item.amount, 0),
          },
        ]
      : sorted;

  const total = grouped.reduce((sum, item) => sum + item.amount, 0);
  return grouped.map((item) => ({ ...item, share: total ? item.amount / total : 0 }));
}
