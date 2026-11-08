import type { SaleRecord } from '../types/models';
import { getSalePaidTotalToman, getSaleProfitToman } from './profit';

export interface SalesStats {
  todayRevenue: number;
  monthRevenue: number;
  todayProfit: number;
  monthProfit: number;
  todayQuantity: number;
  monthQuantity: number;
}

/** Totals for sales made today and during the current calendar month. */
export function computeSalesStats(sales: SaleRecord[], now: Date = new Date()): SalesStats {
  const stats: SalesStats = {
    todayRevenue: 0,
    monthRevenue: 0,
    todayProfit: 0,
    monthProfit: 0,
    todayQuantity: 0,
    monthQuantity: 0,
  };

  for (const sale of sales) {
    const date = new Date(sale.soldAt);
    const sameMonth =
      date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();

    if (!sameMonth) continue;

    const paid = getSalePaidTotalToman(sale);
    const profit = getSaleProfitToman(sale);

    stats.monthRevenue += paid;
    stats.monthProfit += profit;
    stats.monthQuantity += sale.quantity;

    if (date.getDate() === now.getDate()) {
      stats.todayRevenue += paid;
      stats.todayProfit += profit;
      stats.todayQuantity += sale.quantity;
    }
  }

  return stats;
}
