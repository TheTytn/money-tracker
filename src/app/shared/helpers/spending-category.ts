const INITIAL_BALANCE_PATTERN = /^Initial balance '.*'$/;
const TRANSFER_PATTERN = /^(To|From) '.*'$/;

/** True for rows that move money between accounts or set a starting balance. They are not spendings or income. */
export function isTransferOrBalance(category: string): boolean {
  return INITIAL_BALANCE_PATTERN.test(category) || TRANSFER_PATTERN.test(category);
}
