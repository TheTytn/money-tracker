import { Spending } from '@shared/models';

import { SpendingsFileError, SpendingsFileErrorReason } from './spendings-file-error';

/** Column headers, in order. The same layout as a Monefy CSV export. */
export const SPENDINGS_CSV_HEADER = [
  'date',
  'account',
  'category',
  'amount',
  'currency',
  'converted amount',
  'currency',
  'description',
] as const;

const DELIMITER = ',';
const QUOTE = '"';
const LINE_BREAK = '\n';
const BOM = '﻿';
const DATE_PATTERN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
const AMOUNT_PATTERN = /^-?(\d{1,3}(,\d{3})+|\d+)(\.\d+)?$/;

/** Parses the text of a data file into spendings. Throws `SpendingsFileError` on any problem. */
export function parseSpendingsCsv(text: string): Spending[] {
  const [header, ...rows] = splitCsvRecords(text.startsWith(BOM) ? text.slice(BOM.length) : text);
  if (!header || !isExpectedHeader(header.fields)) {
    throw new SpendingsFileError(
      SpendingsFileErrorReason.InvalidHeader,
      `The file doesn't have the expected columns: ${SPENDINGS_CSV_HEADER.join(', ')}.`,
    );
  }
  return rows.filter((row) => !isBlank(row.fields)).map((row) => toSpending(row.fields, row.line));
}

/** Writes spendings as CSV text (LF line breaks, header first, no BOM). */
export function serializeSpendingsCsv(spendings: readonly Spending[]): string {
  const lines = [
    SPENDINGS_CSV_HEADER.join(DELIMITER),
    ...spendings.map((s) =>
      [
        formatDate(s.date),
        s.account,
        s.category,
        formatAmount(s.amount),
        s.currency,
        formatAmount(s.convertedAmount),
        s.convertedCurrency,
        s.description,
      ]
        .map(quoteField)
        .join(DELIMITER),
    ),
  ];
  return lines.join(LINE_BREAK) + LINE_BREAK;
}

interface CsvRecord {
  fields: string[];
  /** 1-based line number where the record starts. */
  line: number;
}

/** RFC 4180 style splitting: quoted fields may contain commas, quotes ("") and line breaks. */
function splitCsvRecords(text: string): CsvRecord[] {
  const records: CsvRecord[] = [];
  let fields: string[] = [];
  let field = '';
  let inQuotes = false;
  let line = 1;
  let recordLine = 1;

  const endRecord = (): void => {
    fields.push(field);
    records.push({ fields, line: recordLine });
    fields = [];
    field = '';
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === QUOTE && text[i + 1] === QUOTE) {
        field += QUOTE;
        i++;
      } else if (char === QUOTE) {
        inQuotes = false;
      } else {
        if (char === LINE_BREAK) {
          line++;
        }
        field += char;
      }
    } else if (char === QUOTE) {
      inQuotes = true;
    } else if (char === DELIMITER) {
      fields.push(field);
      field = '';
    } else if (char === '\r' && text[i + 1] === LINE_BREAK) {
      continue;
    } else if (char === LINE_BREAK) {
      endRecord();
      line++;
      recordLine = line;
    } else {
      field += char;
    }
  }
  if (field !== '' || fields.length > 0) {
    endRecord();
  }
  return records;
}

function isExpectedHeader(fields: string[]): boolean {
  return (
    fields.length === SPENDINGS_CSV_HEADER.length &&
    fields.every((field, i) => field.trim().toLowerCase() === SPENDINGS_CSV_HEADER[i])
  );
}

function isBlank(fields: string[]): boolean {
  return fields.every((field) => field.trim() === '');
}

function toSpending(fields: string[], line: number): Spending {
  if (fields.length !== SPENDINGS_CSV_HEADER.length) {
    throw invalidRow(line, `expected ${SPENDINGS_CSV_HEADER.length} columns, found ${fields.length}`);
  }
  const [date, account, category, amount, currency, convertedAmount, convertedCurrency, description] = fields;
  return {
    date: parseDate(date, line),
    account,
    category,
    amount: parseAmount(amount, line),
    currency,
    convertedAmount: parseAmount(convertedAmount, line),
    convertedCurrency,
    description,
  };
}

/** `dd/MM/yyyy` → `yyyy-MM-dd`. */
function parseDate(value: string, line: number): string {
  const match = DATE_PATTERN.exec(value.trim());
  if (!match) {
    throw invalidRow(line, `"${value}" is not a date in dd/MM/yyyy format`);
  }
  const [, day, month, year] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (date.getUTCDate() !== Number(day) || date.getUTCMonth() !== Number(month) - 1) {
    throw invalidRow(line, `"${value}" is not a real date`);
  }
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/** `yyyy-MM-dd` → `dd/MM/yyyy`. */
function formatDate(value: string): string {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

/** Accepts `-1,477.01`, `2300`, `-17.5`: comma as thousands separator, dot as decimal point. */
function parseAmount(value: string, line: number): number {
  const trimmed = value.trim();
  if (!AMOUNT_PATTERN.test(trimmed)) {
    throw invalidRow(line, `"${value}" is not an amount`);
  }
  return Number(trimmed.replaceAll(',', ''));
}

/** Formats like the source file: thousands separators, only the decimals the number has. */
function formatAmount(value: number): string {
  const [integer, fraction] = String(Math.abs(value)).split('.');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${value < 0 ? '-' : ''}${grouped}${fraction ? `.${fraction}` : ''}`;
}

function quoteField(value: string): string {
  return /[",\r\n]/.test(value) ? `${QUOTE}${value.replaceAll(QUOTE, QUOTE + QUOTE)}${QUOTE}` : value;
}

function invalidRow(line: number, detail: string): SpendingsFileError {
  return new SpendingsFileError(SpendingsFileErrorReason.InvalidRow, `Line ${line}: ${detail}.`);
}
