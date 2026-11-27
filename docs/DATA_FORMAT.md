# Data format

The data file is a CSV file in the same layout as a Monefy export, so a Monefy backup can be opened directly.

## Columns

The first row is the header, exactly in this order (header names are case-insensitive):

```
date,account,category,amount,currency,converted amount,currency,description
```

| Column             | Example          | Notes                                                              |
| ------------------ | ---------------- | ------------------------------------------------------------------ |
| `date`             | `03/02/2024`     | `dd/MM/yyyy`                                                       |
| `account`          | `Cash`           | Account name                                                       |
| `category`         | `Groceries`      | Category name, see special categories below                        |
| `amount`           | `"-1,250.5"`     | Negative = expense, positive = income. `,` thousands, `.` decimals |
| `currency`         | `UAH`            | Currency of `amount`                                               |
| `converted amount` | `"-1,250.5"`     | Amount in the main currency, same number format                    |
| `currency`         | `UAH`            | Main currency (second column with the same name)                   |
| `description`      | `Bread and milk` | Optional free text                                                 |

Example:

```csv
date,account,category,amount,currency,converted amount,currency,description
01/02/2024,Cash,Initial balance 'Cash',"1,000",EUR,"1,000",EUR,
03/02/2024,Cash,Groceries,-12.5,EUR,-12.5,EUR,Bread and milk
20/02/2024,Card,To 'Cash',-100,EUR,-100,EUR,
20/02/2024,Cash,From 'Card',100,EUR,100,EUR,
```

## Special categories

- `Initial balance '<account>'`: the starting balance of an account.
- `To '<account>'` and `From '<account>'`: a transfer between accounts, written as two rows. Not a spending or income; leave them out of spending totals and charts.

## Parsing rules

- Fields follow RFC 4180: a field with a comma, quote or line break is wrapped in `"`, and quotes inside are doubled.
- Line breaks can be LF or CRLF. Blank lines are skipped.
- Encoding: UTF-8, with or without a BOM. Files that are not valid UTF-8 are read as Windows-1251 (older exports with Cyrillic text).
- Any row with the wrong number of columns, an invalid date or an invalid amount rejects the whole file, and the error names the line.

## Writing

- UTF-8 with a BOM, so spreadsheet apps show Cyrillic text correctly.
- LF line breaks, the header first, the same column order and number format as above.
- Default file name for new files: `money-tracker.csv`.

## In the app

Each row becomes a `Spending` (`src/app/shared/models/spending.model.ts`): `date` (`yyyy-MM-dd`), `account`, `category`, `amount`, `currency`, `convertedAmount`, `convertedCurrency`, `description`. `SpendingsStore` (`@core/state`) holds the current file and exposes `spendings()`.
