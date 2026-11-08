import { describe, expect, it } from 'vitest';
import { calculateDiscountToman } from './discount';

describe('calculateDiscountToman', () => {
  it('treats an empty input as no discount', () => {
    expect(calculateDiscountToman('percent', '', 1000000)).toBe(0);
    expect(calculateDiscountToman('amount', '  ', 1000000)).toBe(0);
    expect(calculateDiscountToman('finalAmount', '', 1000000)).toBe(0);
  });

  it('calculates a percentage of the line total', () => {
    expect(calculateDiscountToman('percent', '10', 1000000)).toBe(100000);
    expect(calculateDiscountToman('percent', '12.5', 1000001)).toBe(125000);
    expect(calculateDiscountToman('percent', '100', 750000)).toBe(750000);
    expect(calculateDiscountToman('percent', '۱۰', 1000000)).toBe(100000);
  });

  it('rejects an invalid percentage', () => {
    expect(() => calculateDiscountToman('percent', '101', 1000)).toThrow();
    expect(() => calculateDiscountToman('percent', '-5', 1000)).toThrow();
    expect(() => calculateDiscountToman('percent', 'abc', 1000)).toThrow();
    expect(() => calculateDiscountToman('percent', '10.555', 1000)).toThrow();
  });

  it('uses a fixed amount as the discount', () => {
    expect(calculateDiscountToman('amount', '50,000', 1000000)).toBe(50000);
    expect(calculateDiscountToman('amount', '1000000', 1000000)).toBe(1000000);
    expect(() => calculateDiscountToman('amount', '1000001', 1000000)).toThrow();
    expect(() => calculateDiscountToman('amount', '10.5', 1000000)).toThrow();
  });

  it('derives the discount from the amount the customer will pay', () => {
    expect(calculateDiscountToman('finalAmount', '850000', 1000000)).toBe(150000);
    expect(calculateDiscountToman('finalAmount', '1000000', 1000000)).toBe(0);
    expect(calculateDiscountToman('finalAmount', '0', 1000000)).toBe(1000000);
    expect(() => calculateDiscountToman('finalAmount', '1000001', 1000000)).toThrow();
  });
});
