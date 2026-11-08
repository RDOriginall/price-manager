import { describe, expect, it } from 'vitest';
import type { SaleRecord } from '../types/models';
import { getSaleProfitToman, getSaleUnitCostToman } from './profit';

const sale = (overrides: Partial<SaleRecord> = {}): SaleRecord => ({
  productId: 1,
  productName: 'Test',
  quantity: 2,
  currencyCode: 'USD',
  productPriceMinorAtSale: 1250,
  priceMultiplierBpsAtSale: 11000,
  exchangeRateToToman: 60000,
  unitPriceToman: 825000,
  totalPriceToman: 1650000,
  soldAt: '2026-10-15T12:00:00.000Z',
  ...overrides,
});

describe('sale profit', () => {
  it('uses the base price at the sale-time rate as the unit cost', () => {
    expect(getSaleUnitCostToman(sale())).toBe(750000);
  });

  it('is the amount charged minus the cost of the units sold', () => {
    expect(getSaleProfitToman(sale())).toBe(150000);
  });

  it('uses the base price directly for Toman products', () => {
    const toman = sale({
      currencyCode: 'Toman',
      exchangeRateToToman: null,
      productPriceMinorAtSale: 50000,
      priceMultiplierBpsAtSale: 12000,
      unitPriceToman: 60000,
      totalPriceToman: 120000,
    });

    expect(getSaleUnitCostToman(toman)).toBe(50000);
    expect(getSaleProfitToman(toman)).toBe(20000);
  });

  it('can be negative when a product is sold below its base price', () => {
    expect(
      getSaleProfitToman(
        sale({ priceMultiplierBpsAtSale: 9000, unitPriceToman: 675000, totalPriceToman: 1350000 }),
      ),
    ).toBe(-150000);
  });
});
