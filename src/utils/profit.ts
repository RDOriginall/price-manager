import type { SaleRecord } from '../types/models';
import { calculateTomanPrice } from './price';

/**
 * Cost of one unit in Toman: the product's base price as it was at the time of the sale,
 * converted with the exchange rate used for that sale.
 */
export function getSaleUnitCostToman(sale: SaleRecord): number {
  if (sale.currencyCode === 'Toman' || sale.exchangeRateToToman === null) {
    return sale.productPriceMinorAtSale;
  }

  return Number(
    calculateTomanPrice(
      { foreignPriceMinor: sale.productPriceMinorAtSale },
      { rateToToman: sale.exchangeRateToToman },
    ),
  );
}

/** Discount given on a sale line in Toman (0 for sales recorded without a discount). */
export function getSaleDiscountToman(sale: SaleRecord): number {
  return sale.discountToman ?? 0;
}

/** Amount the customer actually paid for a sale line, after the discount. */
export function getSalePaidTotalToman(sale: SaleRecord): number {
  return sale.totalPriceToman - getSaleDiscountToman(sale);
}

/** Profit of one sale record in Toman: amount paid minus the cost of the units sold. */
export function getSaleProfitToman(sale: SaleRecord): number {
  return getSalePaidTotalToman(sale) - getSaleUnitCostToman(sale) * sale.quantity;
}
