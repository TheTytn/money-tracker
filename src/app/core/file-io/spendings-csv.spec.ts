import { Spending } from '@shared/models';

import { SPENDINGS_CSV_HEADER, parseSpendingsCsv, serializeSpendingsCsv } from './spendings-csv';
import { SpendingsFileError, SpendingsFileErrorReason } from './spendings-file-error';

describe('spendings CSV', () => {
  const header = SPENDINGS_CSV_HEADER.join(',');
  const sampleCsv = [
    header,
    `01/02/2024,Cash,Initial balance 'Cash',"1,000",EUR,"1,000",EUR,`,
    '03/02/2024,Cash,Groceries,-12.5,EUR,-12.5,EUR,Bread and milk',
    '15/02/2024,Card,Salary,"2,500.75",EUR,"2,500.75",EUR,',
    `20/02/2024,Card,To 'Cash',-100,EUR,-100,EUR,"Note with, comma and ""quotes"""`,
    '',
  ].join('\n');
  const sampleSpendings: Spending[] = [
    {
      date: '2024-02-01',
      account: 'Cash',
      category: "Initial balance 'Cash'",
      amount: 1000,
      currency: 'EUR',
      convertedAmount: 1000,
      convertedCurrency: 'EUR',
      description: '',
    },
    {
      date: '2024-02-03',
      account: 'Cash',
      category: 'Groceries',
      amount: -12.5,
      currency: 'EUR',
      convertedAmount: -12.5,
      convertedCurrency: 'EUR',
      description: 'Bread and milk',
    },
    {
      date: '2024-02-15',
      account: 'Card',
      category: 'Salary',
      amount: 2500.75,
      currency: 'EUR',
      convertedAmount: 2500.75,
      convertedCurrency: 'EUR',
      description: '',
    },
    {
      date: '2024-02-20',
      account: 'Card',
      category: "To 'Cash'",
      amount: -100,
      currency: 'EUR',
      convertedAmount: -100,
      convertedCurrency: 'EUR',
      description: 'Note with, comma and "quotes"',
    },
  ];

  function parseError(text: string): SpendingsFileError {
    try {
      parseSpendingsCsv(text);
    } catch (error) {
      if (error instanceof SpendingsFileError) {
        return error;
      }
      throw error;
    }
    throw new Error('Expected a SpendingsFileError');
  }

  describe('parseSpendingsCsv', () => {
    it('should parse rows in the Monefy export layout', () => {
      expect(parseSpendingsCsv(sampleCsv)).toEqual(sampleSpendings);
    });

    it('should accept CRLF line breaks, a BOM, blank lines and a header in any case', () => {
      const text = '﻿' + sampleCsv.toUpperCase().split('\n')[0] + '\r\n\r\n' + sampleCsv.split('\n')[2] + '\r\n';

      expect(parseSpendingsCsv(text)).toEqual([sampleSpendings[1]]);
    });

    it('should keep line breaks inside quoted descriptions', () => {
      const text = `${header}\n03/02/2024,Cash,Groceries,-1,EUR,-1,EUR,"two\nlines"\n`;

      expect(parseSpendingsCsv(text)[0].description).toBe('two\nlines');
    });

    it('should return no spendings for a header-only file', () => {
      expect(parseSpendingsCsv(`${header}\n`)).toEqual([]);
    });

    it.each([
      ['an empty file', ''],
      ['missing columns', 'date,account,category,amount\n'],
      ['different columns', header.replace('category', 'tag') + '\n'],
    ])('should reject %s', (_label, text) => {
      expect(parseError(text).reason).toBe(SpendingsFileErrorReason.InvalidHeader);
    });

    it.each([
      ['a wrong column count', '03/02/2024,Cash,Groceries,-1,EUR,-1,EUR', 'expected 8 columns'],
      ['a non-date', '2024-02-03,Cash,Groceries,-1,EUR,-1,EUR,', 'dd/MM/yyyy'],
      ['an impossible date', '31/02/2024,Cash,Groceries,-1,EUR,-1,EUR,', 'not a real date'],
      ['a non-number amount', '03/02/2024,Cash,Groceries,abc,EUR,-1,EUR,', 'not an amount'],
      ['a badly grouped amount', '03/02/2024,Cash,Groceries,"1,00",EUR,-1,EUR,', 'not an amount'],
    ])('should reject a row with %s and name the line', (_label, row, detail) => {
      const error = parseError(`${header}\n03/02/2024,Cash,Groceries,-1,EUR,-1,EUR,\n${row}\n`);

      expect(error.reason).toBe(SpendingsFileErrorReason.InvalidRow);
      expect(error.message).toContain('Line 3');
      expect(error.message).toContain(detail);
    });
  });

  describe('serializeSpendingsCsv', () => {
    it('should write the same layout it reads', () => {
      expect(serializeSpendingsCsv(sampleSpendings)).toBe(sampleCsv);
    });

    it('should keep spaces in descriptions without adding quotes', () => {
      const text = `${header}\n03/02/2024,Cash,Groceries,-1,EUR,-1,EUR,trailing space \n`;

      expect(parseSpendingsCsv(text)[0].description).toBe('trailing space ');
      expect(serializeSpendingsCsv(parseSpendingsCsv(text))).toBe(text);
    });

    it('should write only the header for no spendings', () => {
      expect(serializeSpendingsCsv([])).toBe(`${header}\n`);
    });

    it('should round-trip large and fractional amounts', () => {
      const spending = { ...sampleSpendings[1], amount: -1234567.89, convertedAmount: 0.1 };

      expect(parseSpendingsCsv(serializeSpendingsCsv([spending]))).toEqual([spending]);
    });
  });
});
