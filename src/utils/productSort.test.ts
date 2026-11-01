import { describe, expect, it } from 'vitest';
import type { Product } from '../types/models';
import { compareProductsByCode } from './productSort';

const product = (name: string, code?: string): Product => ({
  name,
  code,
  currencyCode: 'USD',
  foreignPriceMinor: 100,
  stockQuantity: 0,
  priceMultiplierBps: 10000,
  createdAt: '',
  updatedAt: '',
});

const sortedCodes = (codes: (string | undefined)[]) =>
  codes
    .map((code, index) => product(`P${index}`, code))
    .sort(compareProductsByCode)
    .map((p) => p.code);

describe('compareProductsByCode', () => {
  it('sorts numeric codes by value, not as text', () => {
    expect(sortedCodes(['10', '2', '1', '100', '20'])).toEqual(['1', '2', '10', '20', '100']);
  });

  it('puts numbers before letters and sorts letters from A to Z', () => {
    expect(sortedCodes(['b', 'A', '2', 'c', '1'])).toEqual(['1', '2', 'A', 'b', 'c']);
  });

  it('uses natural order for mixed codes', () => {
    expect(sortedCodes(['A10', 'A2', 'a1', 'B1'])).toEqual(['a1', 'A2', 'A10', 'B1']);
  });

  it('places products without a code last', () => {
    expect(sortedCodes([undefined, '5', '', 'A1'])).toEqual(['5', 'A1', undefined, '']);
  });

  it('falls back to the name when codes are equal', () => {
    const sorted = [product('Zed', 'X1'), product('Alpha', 'x1')].sort(compareProductsByCode);
    expect(sorted.map((p) => p.name)).toEqual(['Alpha', 'Zed']);
  });
});
