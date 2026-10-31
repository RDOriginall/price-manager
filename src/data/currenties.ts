export const CURRENCIES = [
  {
    code: 'Toman',
    name: 'Toman',
    symbol: 'تومان',
    minorUnit: 2,
  },
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    minorUnit: 2,
  },
  {
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'د.إ',
    minorUnit: 2,
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    minorUnit: 2,
  },
  {
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: '¥',
    minorUnit: 2,
  },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]['code'];