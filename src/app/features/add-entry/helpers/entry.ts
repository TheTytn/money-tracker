import { isTransferOrBalance } from '@shared/helpers';
import { Spending } from '@shared/models';

import { EntryType } from '../enums';

/** Used for the first entry, when the file has no rows to copy them from. */
export const DEFAULT_ACCOUNT = 'Cash';
export const DEFAULT_CURRENCY = 'UAH';

export interface EntryInput {
  type: EntryType;
  /** Positive amount as typed. */
  amount: number;
  category: string;
  /** `yyyy-MM-dd`. */
  date: string;
}

/** Categories used before for this type of entry, most used first. */
export function categorySuggestions(spendings: readonly Spending[], type: EntryType, limit = 12): string[] {
  const counts = new Map<string, number>();
  for (const spending of spendings) {
    const matchesType = type === EntryType.Spending ? spending.amount < 0 : spending.amount > 0;
    if (matchesType && !isTransferOrBalance(spending.category)) {
      counts.set(spending.category, (counts.get(spending.category) ?? 0) + 1);
    }
  }
  return [...counts]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([category]) => category);
}

/** Builds a row in the main currency. The account is copied from the most recent regular row. */
export function createEntry(spendings: readonly Spending[], input: EntryInput): Spending {
  const regular = spendings.filter((spending) => !isTransferOrBalance(spending.category));
  const latest = regular.at(-1) ?? spendings.at(-1);
  const currency = latest?.convertedCurrency || DEFAULT_CURRENCY;
  const amount = input.type === EntryType.Spending ? -Math.abs(input.amount) : Math.abs(input.amount);
  return {
    date: input.date,
    account: latest?.account || DEFAULT_ACCOUNT,
    category: input.category.trim(),
    amount,
    currency,
    convertedAmount: amount,
    convertedCurrency: currency,
    description: '',
  };
}
