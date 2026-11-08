import ExcelJS from 'exceljs';
import { getSalesHistory } from '../db/salesRepository';
import { formatCurrencyCode } from '../data/currencyLabels';
import { formatPersianMonthKey, getPersianMonthKey } from './persianDate';
import { getPercentChange } from './price';
import {
  getSaleDiscountToman,
  getSalePaidTotalToman,
  getSaleProfitToman,
  getSaleUnitCostToman,
} from './profit';

export async function exportSalesToExcel(): Promise<void> {
  const sales = await getSalesHistory();

  if (sales.length === 0) {
    throw new Error('تاریخچه فروشی برای خروجی گرفتن وجود ندارد.');
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Price Manager';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('تاریخچه فروش');

  worksheet.columns = [
    { header: 'شناسه فروش', key: 'id', width: 14 },
    { header: 'تاریخ و ساعت', key: 'soldAt', width: 24 },
    { header: 'ماه', key: 'month', width: 16 },
    { header: 'نام محصول', key: 'productName', width: 28 },
    { header: 'کد محصول', key: 'productCode', width: 18 },
    { header: 'تعداد', key: 'quantity', width: 12 },
    { header: 'ارز اصلی', key: 'currencyCode', width: 14 },
    { header: 'قیمت پایه هنگام فروش', key: 'basePrice', width: 22 },
    { header: 'ضریب قیمت (%)', key: 'multiplier', width: 18 },
    { header: 'قیمت واحد (تومان)', key: 'unitPriceToman', width: 22 },
    { header: 'مبلغ کل (تومان)', key: 'totalPriceToman', width: 22 },
    { header: 'تخفیف (تومان)', key: 'discountToman', width: 18 },
    { header: 'مبلغ پس از تخفیف (تومان)', key: 'paidTotalToman', width: 26 },
    { header: 'هزینه واحد (تومان)', key: 'unitCostToman', width: 22 },
    { header: 'سود (تومان)', key: 'profitToman', width: 20 },
  ];

  for (const sale of sales) {
    worksheet.addRow({
      id: sale.id ?? '',
      soldAt: new Date(sale.soldAt).toLocaleString('fa-IR'),
      month: formatPersianMonthKey(getPersianMonthKey(new Date(sale.soldAt))),
      productName: sale.productName,
      productCode: sale.productCode ?? '',
      quantity: sale.quantity,
      currencyCode: formatCurrencyCode(sale.currencyCode),
      basePrice:
        sale.currencyCode === 'Toman'
          ? sale.productPriceMinorAtSale
          : sale.productPriceMinorAtSale / 100,
      multiplier: getPercentChange(sale.priceMultiplierBpsAtSale),
      unitPriceToman: sale.unitPriceToman,
      totalPriceToman: sale.totalPriceToman,
      discountToman: getSaleDiscountToman(sale),
      paidTotalToman: getSalePaidTotalToman(sale),
      unitCostToman: getSaleUnitCostToman(sale),
      profitToman: getSaleProfitToman(sale),
    });
  }

  worksheet.getRow(1).font = { bold: true };
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `sales-history-${date}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}
