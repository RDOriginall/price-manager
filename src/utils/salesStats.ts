import type { SaleRecord } from '../types/models';

export interface SalesStats {
  todayRevenue: number;
  monthRevenue: number;
  todayQuantity: number;
  monthQuantity: number;
}

/** Totals for sales made today and during the current calendar month. */
export function computeSalesStats(sales: SaleRecord[], now: Date = new Date()): SalesStats {
  const stats: SalesStats = {
    todayRevenue: 0,
    monthRevenue: 0,
    todayQuantity: 0,
    monthQuantity: 0,
  };

  for (const sale of sales) {
    const date = new Date(sale.soldAt);
    const sameMonth =
      date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();

    if (!sameMonth) continue;

    stats.monthRevenue += sale.totalPriceToman;
    stats.monthQuantity += sale.quantity;

    if (date.getDate() === now.getDate()) {
      stats.todayRevenue += sale.totalPriceToman;
      stats.todayQuantity += sale.quantity;
    }
  }

  return stats;
}
