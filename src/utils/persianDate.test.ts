import { describe, expect, it } from 'vitest';
import { formatPersianMonthKey, getPersianMonthKey, toPersianDate } from './persianDate';

describe('persianDate', () => {
  it('converts Gregorian dates to Persian dates', () => {
    expect(toPersianDate(new Date(2026, 9, 22, 12))).toEqual({ year: 1405, month: 7, day: 30 });
    expect(toPersianDate(new Date(2026, 9, 23, 12))).toEqual({ year: 1405, month: 8, day: 1 });
    expect(toPersianDate(new Date(2026, 10, 8, 12))).toEqual({ year: 1405, month: 8, day: 17 });
    expect(toPersianDate(new Date(2026, 10, 22, 12))).toEqual({ year: 1405, month: 9, day: 1 });
  });

  it('builds sortable month keys', () => {
    expect(getPersianMonthKey(new Date(2026, 9, 23, 12))).toBe('1405-08');
    expect(getPersianMonthKey(new Date(2026, 9, 22, 12))).toBe('1405-07');
    expect(
      getPersianMonthKey(new Date(2026, 9, 22, 12)) < getPersianMonthKey(new Date(2026, 9, 23, 12)),
    ).toBe(true);
  });

  it('formats month keys with the Persian month name and year', () => {
    expect(formatPersianMonthKey('1405-08')).toBe('آبان ۱۴۰۵');
    expect(formatPersianMonthKey('1405-12')).toBe('اسفند ۱۴۰۵');
  });
});
