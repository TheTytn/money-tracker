/** Formats a date as `yyyy-MM-dd` in the device's time zone. */
export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Formats a date as `yyyy-MM` in the device's time zone. */
export function toIsoMonth(date: Date): string {
  return toIsoDate(date).slice(0, 7);
}

/** Moves a `yyyy-MM` month by the given number of months. */
export function addMonths(month: string, delta: number): string {
  const [year, monthNumber] = month.split('-').map(Number);
  return toIsoMonth(new Date(year, monthNumber - 1 + delta, 1));
}
