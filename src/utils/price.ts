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
export function calculateTomanPrice(
  product: Pick<Product, 'foreignPriceMinor'>,
  rate: Pick<ExchangeRate, 'rateToToman'>,
): bigint {
  const numerator = BigInt(product.foreignPriceMinor) * BigInt(rate.rateToToman);
  return (numerator + 50n) / 100n;
}

/** Price in whole Toman before the per-product price adjustment, or null when no rate is set. */
export function getBaseTomanPrice(
  product: Pick<Product, 'currencyCode' | 'foreignPriceMinor'>,
  rate: ExchangeRate | undefined,
): number | null {
  if (product.currencyCode === 'Toman') return product.foreignPriceMinor;

  return rate ? Number(calculateTomanPrice(product, rate)) : null;
}

/** Initial price in Toman, before the percentage adjustment is applied. */
export function formatBaseTomanPrice(product: Product, rate: ExchangeRate | undefined): string {
  const basePrice = getBaseTomanPrice(product, rate);

  if (basePrice === null) return 'نرخ ثبت نشده';

  return `${numberFormatter.format(basePrice)} تومان`;
}

/** Final unit price in whole Toman including the price adjustment, or null without a rate. */
export function getFinalUnitPriceToman(
  product: Pick<Product, 'currencyCode' | 'foreignPriceMinor' | 'priceMultiplierBps'>,
  rate: ExchangeRate | undefined,
): number | null {
  const basePrice = getBaseTomanPrice(product, rate);

  if (basePrice === null) return null;

  return Math.round((basePrice * (product.priceMultiplierBps ?? 10000)) / 10000);
}

/** Final price in Toman, including the percentage adjustment. */
export function formatTomanPrice(product: Product, rate: ExchangeRate | undefined): string {
  const finalPrice = getFinalUnitPriceToman(product, rate);

  if (finalPrice === null) return 'نرخ ثبت نشده';

  return `${numberFormatter.format(finalPrice)} تومان`;
}

/** Converts Persian/Arabic digits to Latin and removes thousands separators and spaces. */
export function normalizeNumberInput(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[,٬\s]/g, '');
}

/**
 * Multiplier (in basis points, possibly fractional) that turns a base Toman price into the
 * wanted final price. The product then keeps this margin when the exchange rate changes.
 */
export function calculateMultiplierForFinalPrice(baseToman: number, finalToman: number): number {
  if (!Number.isSafeInteger(baseToman) || baseToman <= 0) {
    throw new Error('قیمت اولیه باید بیشتر از صفر باشد تا بتوان قیمت نهایی را تعیین کرد.');
  }

  if (!Number.isSafeInteger(finalToman) || finalToman <= 0) {
    throw new Error('قیمت نهایی باید عدد صحیح و بزرگ‌تر از صفر باشد.');
  }

  return (finalToman / baseToman) * 10000;
}

/** Percentage change for display, rounded to two decimals (11000 bps becomes 10). */
export function getPercentChange(multiplierBps: number): number {
  return Number((multiplierBps / 100 - 100).toFixed(2));
}
