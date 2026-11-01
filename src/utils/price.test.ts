import { describe, expect, it } from 'vitest';
import type { ExchangeRate, Product } from '../types/models';
import { numberFormatter } from './format';
import { calculateTomanPrice, formatRialPrice, formatTomanPrice, parsePriceToMinor } from './price';

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

describe('formatRialPrice', () => {
  it('reports a missing rate', () => {
    expect(formatRialPrice(product(), undefined)).toBe('نرخ ثبت نشده');
  });

  it('is ten times the Toman price', () => {
    expect(formatRialPrice(product(), rate(60000))).toBe(`${numberFormatter.format(7500000)} ریال`);
  });
});
