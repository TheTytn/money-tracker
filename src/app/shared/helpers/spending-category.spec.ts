import { isTransferOrBalance } from './spending-category';

describe('isTransferOrBalance', () => {
  it('should match initial balances and transfers', () => {
    expect(isTransferOrBalance("Initial balance 'Cash'")).toBe(true);
    expect(isTransferOrBalance("To 'Card'")).toBe(true);
    expect(isTransferOrBalance("From 'Cash'")).toBe(true);
  });

  it('should not match regular categories', () => {
    expect(isTransferOrBalance('Groceries')).toBe(false);
    expect(isTransferOrBalance('Tours')).toBe(false);
    expect(isTransferOrBalance("Tom's gift")).toBe(false);
  });
});
