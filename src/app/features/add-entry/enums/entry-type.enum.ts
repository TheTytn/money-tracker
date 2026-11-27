/** Kind of entry the add page creates. Also the value of the `:type` route parameter. */
export const EntryType = {
  Spending: 'spending',
  Income: 'income',
} as const;

export type EntryType = (typeof EntryType)[keyof typeof EntryType];
