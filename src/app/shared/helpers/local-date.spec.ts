import { addMonths, toIsoDate, toIsoMonth } from './local-date';

describe('local-date', () => {
  it('should format a local date and month', () => {
    const date = new Date(2026, 0, 5, 23, 30);

    expect(toIsoDate(date)).toBe('2026-01-05');
    expect(toIsoMonth(date)).toBe('2026-01');
  });

  it('should move months across year boundaries', () => {
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2026-05', 0)).toBe('2026-05');
  });
});
