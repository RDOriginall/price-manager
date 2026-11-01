import { describe, expect, it } from 'vitest';
import type { SaleRecord } from '../types/models';
import { computeSalesStats } from './salesStats';

const sale = (soldAt: string, quantity: number, totalPriceToman: number): SaleRecord => ({
  productId: 1,
  productName: 'Test',
  quantity,
  currencyCode: 'Toman',
  productPriceMinorAtSale: totalPriceToman / quantity,
  priceMultiplierBpsAtSale: 10000,
  exchangeRateToToman: null,
  unitPriceToman: totalPriceToman / quantity,
  totalPriceToman,
  soldAt,
});

describe('computeSalesStats', () => {
  const now = new Date(2026, 9, 15, 12); // 15 Oct 2026, local time

  it('returns zeros when there are no sales', () => {
    expect(computeSalesStats([], now)).toEqual({
      todayRevenue: 0,
      monthRevenue: 0,
      todayQuantity: 0,
      monthQuantity: 0,
    });
  });

  it('separates today, this month and older sales', () => {
    const sales = [
      sale(new Date(2026, 9, 15, 9).toISOString(), 2, 200),
      sale(new Date(2026, 9, 3, 9).toISOString(), 1, 50),
      sale(new Date(2026, 8, 15, 9).toISOString(), 5, 1000),
      sale(new Date(2025, 9, 15, 9).toISOString(), 9, 9000),
    ];

    expect(computeSalesStats(sales, now)).toEqual({
      todayRevenue: 200,
      monthRevenue: 250,
      todayQuantity: 2,
      monthQuantity: 3,
    });
  });
});
