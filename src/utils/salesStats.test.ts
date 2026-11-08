import { describe, expect, it } from 'vitest';
import type { SaleRecord } from '../types/models';
import { computeSalesStats } from './salesStats';

const sale = (
  soldAt: string,
  quantity: number,
  totalPriceToman: number,
  unitCost = totalPriceToman / quantity,
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
  soldAt,
});

describe('computeSalesStats', () => {
  const now = new Date(2026, 9, 15, 12); // 15 Oct 2026, local time

  it('returns zeros when there are no sales', () => {
    expect(computeSalesStats([], now)).toEqual({
      monthLabel: 'مهر ۱۴۰۵',
      todayRevenue: 0,
      monthRevenue: 0,
      todayProfit: 0,
      monthProfit: 0,
      todayQuantity: 0,
      monthQuantity: 0,
    });
  });

  it('separates today, this month and older sales', () => {
    const sales = [
      sale(new Date(2026, 9, 15, 9).toISOString(), 2, 200, 80),
      sale(new Date(2026, 9, 3, 9).toISOString(), 1, 50, 40),
      sale(new Date(2026, 8, 15, 9).toISOString(), 5, 1000),
      sale(new Date(2025, 9, 15, 9).toISOString(), 9, 9000),
    ];

    expect(computeSalesStats(sales, now)).toEqual({
      monthLabel: 'مهر ۱۴۰۵',
      todayRevenue: 200,
      monthRevenue: 250,
      todayProfit: 40,
      monthProfit: 50,
      todayQuantity: 2,
      monthQuantity: 3,
    });
  });

  it('counts the amount paid after discounts', () => {
    const discounted = {
      ...sale(new Date(2026, 9, 15, 9).toISOString(), 2, 200, 80),
      discountToman: 30,
    };

    expect(computeSalesStats([discounted], now)).toMatchObject({
      todayRevenue: 170,
      monthRevenue: 170,
      todayProfit: 10,
      monthProfit: 10,
    });
  });

  it('uses the Persian month, not the Gregorian one', () => {
    const aban17 = new Date(2026, 10, 8, 12); // 17 Aban 1405
    const sales = [
      sale(new Date(2026, 9, 25, 9).toISOString(), 1, 100, 60), // 3 Aban: same Persian month
      sale(new Date(2026, 9, 20, 9).toISOString(), 1, 500, 100), // 28 Mehr: previous month
    ];

    expect(computeSalesStats(sales, aban17)).toMatchObject({
      todayRevenue: 0,
      monthRevenue: 100,
      monthProfit: 40,
      monthQuantity: 1,
    });
  });
});
