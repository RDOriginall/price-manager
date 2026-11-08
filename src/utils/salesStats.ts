import type { SaleRecord } from '../types/models';
import { formatPersianMonthKey, getPersianMonthKey, toPersianDate } from './persianDate';
import { getSalePaidTotalToman, getSaleProfitToman } from './profit';

export interface SalesStats {
  /** Name of the current Persian month, for example "آبان ۱۴۰۵". */
  monthLabel: string;
  todayRevenue: number;
  monthRevenue: number;
  todayProfit: number;
  monthProfit: number;
  todayQuantity: number;
  monthQuantity: number;
}

/** Totals for sales made today and during the current Persian (Jalali) month. */
export function computeSalesStats(sales: SaleRecord[], now: Date = new Date()): SalesStats {
  const stats: SalesStats = {
    monthLabel: formatPersianMonthKey(getPersianMonthKey(now)),
    todayRevenue: 0,
    monthRevenue: 0,
    todayProfit: 0,
    monthProfit: 0,
    todayQuantity: 0,
    monthQuantity: 0,
  };

  const today = toPersianDate(now);

  for (const sale of sales) {
    const date = toPersianDate(new Date(sale.soldAt));

    if (date.year !== today.year || date.month !== today.month) continue;

    const paid = getSalePaidTotalToman(sale);
    const profit = getSaleProfitToman(sale);

    stats.monthRevenue += paid;
    stats.monthProfit += profit;
    stats.monthQuantity += sale.quantity;

    if (date.day === today.day) {
      stats.todayRevenue += paid;
      stats.todayProfit += profit;
      stats.todayQuantity += sale.quantity;
    }
  }

  return stats;
}
