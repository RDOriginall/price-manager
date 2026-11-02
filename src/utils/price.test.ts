import { describe, expect, it } from 'vitest';
import type { ExchangeRate, Product } from '../types/models';
import { numberFormatter } from './format';
import {
  calculateMultiplierForFinalPrice,
  calculateTomanPrice,
  formatBaseTomanPrice,
  formatTomanPrice,
  getPercentChange,
  normalizeNumberInput,
  parsePriceToMinor,
} from './price';

const product = (overrides: Partial<Product> = {}): Product => ({
  name: 'Test',
  currencyCode: 'USD',
  foreignPriceMinor: 1250,
  stockQuantity: 0,
  priceMultiplierBps: 10000,
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

const rate = (rateToToman: number): ExchangeRate => ({
  currencyCode: 'USD',
  rateToToman,
  source: 'manual',
  updatedAt: '',
});

describe('parsePriceToMinor', () => {
  it('converts foreign prices to minor units', () => {
    expect(parsePriceToMinor('12.50', 'USD')).toBe(1250);
    expect(parsePriceToMinor('12.5', 'USD')).toBe(1250);
    expect(parsePriceToMinor('0.07', 'EUR')).toBe(7);
    expect(parsePriceToMinor(' 19 ', 'AED')).toBe(1900);
  });

  it('keeps Toman as a whole number', () => {
    expect(parsePriceToMinor('50000', 'Toman')).toBe(50000);
  });

  it('rejects invalid input', () => {
    expect(() => parsePriceToMinor('12.345', 'USD')).toThrow();
    expect(() => parsePriceToMinor('-5', 'USD')).toThrow();
    expect(() => parsePriceToMinor('abc', 'USD')).toThrow();
    expect(() => parsePriceToMinor('', 'USD')).toThrow();
    expect(() => parsePriceToMinor('50.5', 'Toman')).toThrow();
  });
});

describe('calculateTomanPrice', () => {
  it('multiplies price by the rate', () => {
    expect(calculateTomanPrice(product(), rate(60000))).toBe(750000n);
  });

  it('rounds to the nearest Toman', () => {
    expect(calculateTomanPrice(product({ foreignPriceMinor: 1001 }), rate(3))).toBe(30n);
    expect(calculateTomanPrice(product({ foreignPriceMinor: 1050 }), rate(3))).toBe(32n);
  });
});

describe('formatTomanPrice', () => {
  it('reports a missing rate', () => {
    expect(formatTomanPrice(product(), undefined)).toBe('نرخ ثبت نشده');
  });

  it('applies the price multiplier', () => {
    const text = formatTomanPrice(product({ priceMultiplierBps: 11000 }), rate(60000));
    expect(text).toBe(`${numberFormatter.format(825000)} تومان`);
  });
});

describe('formatBaseTomanPrice', () => {
  it('reports a missing rate', () => {
    expect(formatBaseTomanPrice(product(), undefined)).toBe('نرخ ثبت نشده');
  });

  it('ignores the price adjustment', () => {
    const adjusted = product({ priceMultiplierBps: 11000 });
    expect(formatBaseTomanPrice(adjusted, rate(60000))).toBe(
      `${numberFormatter.format(750000)} تومان`,
    );
  });

  it('shows Toman products without needing a rate', () => {
    const toman = product({ currencyCode: 'Toman', foreignPriceMinor: 50000 });
    expect(formatBaseTomanPrice(toman, undefined)).toBe(`${numberFormatter.format(50000)} تومان`);
  });
});

describe('calculateMultiplierForFinalPrice', () => {
  it('reproduces the typed final price exactly', () => {
    for (const finalToman of [899000, 750001, 123457, 1_000_000]) {
      const multiplier = calculateMultiplierForFinalPrice(750000, finalToman);
      const text = formatTomanPrice(product({ priceMultiplierBps: multiplier }), rate(60000));
      expect(text).toBe(`${numberFormatter.format(finalToman)} تومان`);
    }
  });

  it('rejects a zero base price or a non-positive final price', () => {
    expect(() => calculateMultiplierForFinalPrice(0, 1000)).toThrow();
    expect(() => calculateMultiplierForFinalPrice(1000, 0)).toThrow();
    expect(() => calculateMultiplierForFinalPrice(1000, 10.5)).toThrow();
  });
});

describe('getPercentChange', () => {
  it('rounds to two decimals', () => {
    expect(getPercentChange(10000)).toBe(0);
    expect(getPercentChange(11000)).toBe(10);
    expect(getPercentChange(11986.666666666666)).toBe(19.87);
  });
});

describe('normalizeNumberInput', () => {
  it('converts Persian digits and removes separators', () => {
    expect(normalizeNumberInput('۸۹۹٬۰۰۰')).toBe('899000');
    expect(normalizeNumberInput(' 1,234 567 ')).toBe('1234567');
  });
});
