import { describe, expect, it } from 'vitest';
import { formatCurrencyCode, formatCurrencyOption } from './currencyLabels';

describe('currency display text', () => {
  it('shows Toman in Persian everywhere', () => {
    expect(formatCurrencyCode('Toman')).toBe('تومان');
    expect(formatCurrencyOption('Toman')).toBe('تومان');
  });

  it('keeps the code for foreign currencies', () => {
    expect(formatCurrencyCode('USD')).toBe('USD');
    expect(formatCurrencyOption('USD')).toBe('دلار آمریکا (USD)');
  });
});
