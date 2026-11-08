const PERSIAN_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

// Latin digits so the parts can be read as numbers. Uses the device's local time zone.
const partsFormatter = new Intl.DateTimeFormat('en-u-ca-persian-nu-latn', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});

const yearFormatter = new Intl.NumberFormat('fa-IR', { useGrouping: false });

export interface PersianDate {
  year: number;
  month: number;
  day: number;
}

export function toPersianDate(date: Date): PersianDate {
  const result: PersianDate = { year: 0, month: 0, day: 0 };

  for (const part of partsFormatter.formatToParts(date)) {
    if (part.type === 'year' || part.type === 'month' || part.type === 'day') {
      result[part.type] = Number(part.value);
    }
  }

  return result;
}

/** Sortable key for the Persian month of a date, for example "1405-08". */
export function getPersianMonthKey(date: Date): string {
  const { year, month } = toPersianDate(date);
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** Display name for a month key, for example "1405-08" becomes "آبان ۱۴۰۵". */
export function formatPersianMonthKey(key: string): string {
  const [year, month] = key.split('-').map(Number);
  return `${PERSIAN_MONTH_NAMES[month - 1]} ${yearFormatter.format(year)}`;
}
