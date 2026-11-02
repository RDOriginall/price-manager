
import ExcelJS from 'exceljs';
import { getSalesHistory } from '../db/salesRepository';
import { getPercentChange } from './price';

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
    { header: 'نام محصول', key: 'productName', width: 28 },
    { header: 'کد محصول', key: 'productCode', width: 18 },
    { header: 'تعداد', key: 'quantity', width: 12 },
    { header: 'ارز اصلی', key: 'currencyCode', width: 14 },
    { header: 'قیمت پایه هنگام فروش', key: 'basePrice', width: 22 },
    { header: 'ضریب قیمت (%)', key: 'multiplier', width: 18 },
    { header: 'قیمت واحد (تومان)', key: 'unitPriceToman', width: 22 },
    { header: 'مبلغ کل (تومان)', key: 'totalPriceToman', width: 22 },
  ];

  for (const sale of sales) {
    worksheet.addRow({
      id: sale.id ?? '',
      soldAt: new Date(sale.soldAt).toLocaleString('fa-IR'),
      productName: sale.productName,
      productCode: sale.productCode ?? '',
      quantity: sale.quantity,
      currencyCode: sale.currencyCode,
      basePrice:
      sale.currencyCode === 'Toman'
        ? sale.productPriceMinorAtSale
        : sale.productPriceMinorAtSale / 100,
      multiplier: getPercentChange(sale.priceMultiplierBpsAtSale),
      unitPriceToman: sale.unitPriceToman,
      totalPriceToman: sale.totalPriceToman,
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
