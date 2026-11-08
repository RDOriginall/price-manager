import type { SaleRecord } from '../types/models';
import { formatPersianMonthKey, getPersianMonthKey } from './persianDate';
import { getSaleDiscountToman, getSalePaidTotalToman, getSaleProfitToman } from './profit';

export interface MonthlySummary {
  /** Sortable month key such as "1405-08". */
  key: string;
  label: string;
  salesCount: number;
  quantity: number;
  /** Amount paid by customers after discounts. */
  revenue: number;
  discount: number;
  profit: number;
}

/** Totals for each Persian month that has sales, newest month first. */
export function summarizeSalesByMonth(sales: SaleRecord[]): MonthlySummary[] {
  const byMonth = new Map<string, MonthlySummary>();

  for (const sale of sales) {
    const key = getPersianMonthKey(new Date(sale.soldAt));
    let summary = byMonth.get(key);

    if (!summary) {
      summary = {
        key,
        label: formatPersianMonthKey(key),
        salesCount: 0,
        quantity: 0,
        revenue: 0,
        discount: 0,
        profit: 0,
      };
      byMonth.set(key, summary);
    }

    summary.salesCount += 1;
    summary.quantity += sale.quantity;
    summary.revenue += getSalePaidTotalToman(sale);
    summary.discount += getSaleDiscountToman(sale);
    summary.profit += getSaleProfitToman(sale);
  }

  return [...byMonth.values()].sort((a, b) => b.key.localeCompare(a.key));
}
