import { describe, expect, it } from 'vitest';
import type { SaleRecord } from '../types/models';
import { summarizeSalesByMonth } from './monthlyReport';

const sale = (
  date: Date,
  quantity: number,
  totalPriceToman: number,
  unitCost: number,
  discountToman?: number,
): SaleRecord => ({
  productId: 1,
  productName: 'Test',
  quantity,
  currencyCode: 'Toman',
  productPriceMinorAtSale: unitCost,
  priceMultiplierBpsAtSale: 10000,
  exchangeRateToToman: null,
  unitPriceToman: totalPriceToman / quantity,
  totalPriceToman,
  ...(discountToman ? { discountToman } : {}),
  soldAt: date.toISOString(),
});

describe('summarizeSalesByMonth', () => {
  it('returns nothing without sales', () => {
    expect(summarizeSalesByMonth([])).toEqual([]);
  });

  it('groups sales by Persian month, newest first, with totals', () => {
    const summaries = summarizeSalesByMonth([
      sale(new Date(2026, 9, 25, 10), 2, 200, 80), // 3 Aban
      sale(new Date(2026, 10, 5, 10), 1, 100, 60, 10), // 14 Aban, discounted
      sale(new Date(2026, 9, 20, 10), 1, 50, 30), // 28 Mehr
    ]);

    expect(summaries.map((month) => month.key)).toEqual(['1405-08', '1405-07']);
    expect(summaries[0]).toMatchObject({
      label: 'آبان ۱۴۰۵',
      salesCount: 2,
      quantity: 3,
      revenue: 290,
      discount: 10,
      profit: 70,
    });
    expect(summaries[1]).toMatchObject({ salesCount: 1, quantity: 1, revenue: 50, profit: 20 });
  });
});
