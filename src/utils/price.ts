import type { CurrencyCode } from '../data/currenties';
import type { ExchangeRate, Product } from '../types/models';
import { numberFormatter } from './format';

/** Parses user input into minor units. Toman is a whole number; other currencies have 2 decimals. */
export function parsePriceToMinor(value: string, currencyCode: CurrencyCode): number {
  const normalized = value.trim();
  const pattern = currencyCode === 'Toman' ? /^\d+$/ : /^\d+(?:\.\d{1,2})?$/;

  if (!pattern.test(normalized)) {
    throw new Error(
      currencyCode === 'Toman'
        ? 'قیمت تومانی باید عدد صحیح و مثبت باشد.'
        : 'قیمت باید عددی مثبت با حداکثر دو رقم اعشار باشد.',
    );
  }

  const amount = Number(normalized);
  const result = currencyCode === 'Toman' ? amount : Math.round(amount * 100);

  if (!Number.isSafeInteger(result) || result < 0) {
    throw new Error('قیمت واردشده نامعتبر یا بیش از حد بزرگ است.');
  }

  return result;
}

export function formatForeignPrice(minor: number, currencyCode: CurrencyCode): string {
  if (currencyCode === 'Toman') {
    return numberFormatter.format(minor);
  }
  return (minor / 100).toFixed(2);
}

/** Converts a foreign price (minor units) to whole Toman, rounded to the nearest Toman. */
export function calculateTomanPrice(product: Product, rate: ExchangeRate): bigint {
  const numerator = BigInt(product.foreignPriceMinor) * BigInt(rate.rateToToman);
  return (numerator + 50n) / 100n;
}

export function formatTomanPrice(product: Product, rate: ExchangeRate | undefined): string {
  const basePrice =
    product.currencyCode === 'Toman'
      ? product.foreignPriceMinor
      : rate
        ? Number(calculateTomanPrice(product, rate))
        : null;

  if (basePrice === null) return 'نرخ ثبت نشده';

  const multiplier = product.priceMultiplierBps ?? 10000;
  const finalPrice = Math.round((basePrice * multiplier) / 10000);

  return `${numberFormatter.format(finalPrice)} تومان`;
}

export function formatRialPrice(product: Product, rate: ExchangeRate | undefined): string {
  if (!rate) return 'نرخ ثبت نشده';

  const toman = calculateTomanPrice(product, rate);
  return `${numberFormatter.format(toman * 10n)} ریال`;
}
