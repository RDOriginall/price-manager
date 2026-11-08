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

/** Profit of one sale record in Toman: amount charged minus the cost of the units sold. */
export function getSaleProfitToman(sale: SaleRecord): number {
  return sale.totalPriceToman - getSaleUnitCostToman(sale) * sale.quantity;
}
