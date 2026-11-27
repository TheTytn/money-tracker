import { Spending } from '@shared/models';

import { EntryType } from '../enums';
import { DEFAULT_ACCOUNT, DEFAULT_CURRENCY, categorySuggestions, createEntry } from './entry';

function row(category: string, amount: number, account = 'Cash'): Spending {
  return {
    date: '2026-11-01',
    account,
    category,
    amount,
    currency: 'USD',
    convertedAmount: amount * 40,
    convertedCurrency: 'UAH',
    description: '',
  };
}

describe('entry helpers', () => {
  const rows = [
    row('Food', -1),
    row('Taxi', -2),
    row('Food', -3),
    row('Salary', 100),
    row("Initial balance 'Cash'", 50),
    row("To 'Card'", -10),
  ];

  describe('categorySuggestions', () => {
    it('should list expense categories, most used first, without transfers', () => {
      expect(categorySuggestions(rows, EntryType.Spending)).toEqual(['Food', 'Taxi']);
    });

    it('should list income categories, without initial balances', () => {
      expect(categorySuggestions(rows, EntryType.Income)).toEqual(['Salary']);
    });
  });

  describe('createEntry', () => {
    it('should create a negative row for a spending in the main currency and the latest account', () => {
      const entry = createEntry([...rows, row('Food', -1, 'Card'), row("From 'Cash'", 10, 'Savings')], {
        type: EntryType.Spending,
        amount: 12.5,
        category: ' Coffee ',
        date: '2026-11-27',
      });

      expect(entry).toEqual({
        date: '2026-11-27',
        account: 'Card',
        category: 'Coffee',
        amount: -12.5,
        currency: 'UAH',
        convertedAmount: -12.5,
        convertedCurrency: 'UAH',
        description: '',
      });
    });

    it('should create a positive row for an income with defaults when the file is empty', () => {
      const entry = createEntry([], { type: EntryType.Income, amount: 100, category: 'Salary', date: '2026-11-27' });

      expect(entry.amount).toBe(100);
      expect(entry.account).toBe(DEFAULT_ACCOUNT);
      expect(entry.currency).toBe(DEFAULT_CURRENCY);
    });
  });
});
