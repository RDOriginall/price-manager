import type { CurrencyCode } from './currenties';

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  Toman: 'تومان',
  USD: 'دلار آمریکا',
  AED: 'درهم امارات',
  EUR: 'یورو',
  CNY: 'یوان چین',
};

/** Short text shown to users: "تومان" for Toman, otherwise the code (USD, AED, ...). */
export function formatCurrencyCode(code: CurrencyCode): string {
  return code === 'Toman' ? CURRENCY_LABELS.Toman : code;
}

/** Dropdown and list label: "دلار آمریکا (USD)", but only "تومان" for Toman. */
export function formatCurrencyOption(code: CurrencyCode): string {
  return code === 'Toman' ? CURRENCY_LABELS.Toman : `${CURRENCY_LABELS[code]} (${code})`;
}
