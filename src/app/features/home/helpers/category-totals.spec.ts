import { Spending } from '@shared/models';

import { OTHER_CATEGORIES_LABEL, categoryTotals } from './category-totals';

function row(date: string, category: string, convertedAmount: number): Spending {
  return {
    date,
    account: 'Cash',
    category,
    amount: convertedAmount,
    currency: 'UAH',
    convertedAmount,
    convertedCurrency: 'UAH',
    description: '',
  };
}

describe('categoryTotals', () => {
  it('should sum expenses of the month by category, largest first', () => {
    const totals = categoryTotals(
      [
        row('2026-11-01', 'Food', -30),
        row('2026-11-15', 'Taxi', -50),
        row('2026-11-20', 'Food', -40),
        row('2026-10-31', 'Food', -999),
      ],
      '2026-11',
    );

    expect(totals).toEqual([
      { category: 'Food', amount: 70, share: 70 / 120 },
      { category: 'Taxi', amount: 50, share: 50 / 120 },
    ]);
  });

  it('should leave out income, transfers and initial balances', () => {
    const totals = categoryTotals(
      [
        row('2026-11-01', 'Salary', 1000),
        row('2026-11-01', "Initial balance 'Cash'", 500),
        row('2026-11-02', "To 'Card'", -100),
        row('2026-11-02', "From 'Cash'", 100),
        row('2026-11-03', 'Food', -10),
      ],
      '2026-11',
    );

    expect(totals).toEqual([{ category: 'Food', amount: 10, share: 1 }]);
  });

  it('should merge the smallest categories into Other', () => {
    const rows = [-50, -40, -30, -20, -10].map((amount, index) => row('2026-11-01', `C${index}`, amount));

    const totals = categoryTotals(rows, '2026-11', 3);

    expect(totals.map((t) => [t.category, t.amount])).toEqual([
      ['C0', 50],
      ['C1', 40],
      [OTHER_CATEGORIES_LABEL, 60],
    ]);
  });

  it('should return an empty list for a month without expenses', () => {
    expect(categoryTotals([row('2026-11-01', 'Food', -10)], '2026-12')).toEqual([]);
  });
});
