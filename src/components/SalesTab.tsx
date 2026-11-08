import { useRef, type ChangeEvent } from 'react';
import type { SaleRecord } from '../types/models';
import { exportBackup, importBackup } from '../utils/backup';
import { exportSalesToExcel } from '../utils/exportSalesToExcel';
import { dateFormatter, numberFormatter } from '../utils/format';
import { getErrorMessage } from '../utils/errors';
import { getSaleDiscountToman, getSalePaidTotalToman, getSaleProfitToman } from '../utils/profit';
import { computeSalesStats } from '../utils/salesStats';

interface SalesTabProps {
  active: boolean;
  sales: SaleRecord[];
}

export function SalesTab({ active, sales }: SalesTabProps) {
  const importInputRef = useRef<HTMLInputElement>(null);
  const { todayRevenue, monthRevenue, todayProfit, monthProfit, todayQuantity, monthQuantity } =
    computeSalesStats(sales);

  async function handleExportSales() {
    try {
      await exportSalesToExcel();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'خطا در خروجی گرفتن از تاریخچه فروش';

      alert(message);
    }
  }

  // backup
  async function handleExportBackup() {
    try {
      await exportBackup();
    } catch (error) {
      alert(getErrorMessage(error));
    }
  }

  async function handleImportBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!confirm('با بازیابی بک‌آپ، تمام اطلاعات فعلی جایگزین می‌شود. ادامه می‌دهید؟')) {
      return;
    }

    try {
      await importBackup(file);
      window.location.reload();
    } catch (error) {
      alert(getErrorMessage(error));
    }
  }

  return (
    <>
      <section className='panel' hidden={!active}>
        <div className='section-heading'>
          <div>
            <h2>گزارش فروش</h2>
            <p>
              خلاصه عملکرد فروشگاه. سود یعنی مبلغ فروش منهای قیمت پایه کالا (با نرخ ارز روز فروش).
            </p>
          </div>
        </div>

        <div className='dashboard-grid'>
          <article className='stat-card'>
            <h3>فروش امروز</h3>
            <p>{numberFormatter.format(todayRevenue)} تومان</p>
          </article>

          <article className='stat-card'>
            <h3>فروش این ماه</h3>
            <p>{numberFormatter.format(monthRevenue)} تومان</p>
          </article>

          <article className='stat-card'>
            <h3>سود امروز</h3>
            <p>{numberFormatter.format(todayProfit)} تومان</p>
          </article>

          <article className='stat-card'>
            <h3>سود این ماه</h3>
            <p>{numberFormatter.format(monthProfit)} تومان</p>
          </article>

          <article className='stat-card'>
            <h3>کالای فروخته‌شده امروز</h3>
            <p>{numberFormatter.format(todayQuantity)}</p>
          </article>

          <article className='stat-card'>
            <h3>کالای فروخته‌شده این ماه</h3>
            <p>{numberFormatter.format(monthQuantity)}</p>
          </article>
        </div>
      </section>

      <section className='panel' hidden={!active}>
        <div className='section-heading'>
          <div>
            <h2>تاریخچه فروش</h2>
            <p>{sales.length} گزارش فروش ثبت‌شده</p>
          </div>

          <div className='heading-actions'>
            <button
              type='button'
              className='secondary-button small-button'
              onClick={handleExportSales}
              disabled={sales.length === 0}
            >
              دانلود تاریخچه فروش
            </button>

            <button
              type='button'
              className='secondary-button small-button'
              onClick={handleExportBackup}
            >
              دریافت بک‌آپ
            </button>

            <button
              type='button'
              className='secondary-button small-button'
              onClick={() => importInputRef.current?.click()}
            >
              بازیابی بک‌آپ
            </button>

            <input
              ref={importInputRef}
              type='file'
              accept='application/json,.json'
              hidden
              onChange={handleImportBackup}
            />
          </div>
        </div>

        {sales.length === 0 ? (
          <p className='empty-state'>هنوز فروشی ثبت نشده است</p>
        ) : (
          <div className='table-wrapper'>
            <table>
              <thead>
                <tr>
                  <th>تاریخ فروش</th>
                  <th>نام محصول</th>
                  <th>کد محصول</th>
                  <th>تعداد</th>
                  <th>قیمت واحد: تومان</th>
                  <th>مبلغ کل: تومان</th>
                  <th>تخفیف: تومان</th>
                  <th>مبلغ پس از تخفیف: تومان</th>
                  <th>سود: تومان</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{dateFormatter.format(new Date(sale.soldAt))}</td>
                    <td>{sale.productName}</td>
                    <td>{sale.productCode}</td>
                    <td>{numberFormatter.format(sale.quantity)}</td>
                    <td>{numberFormatter.format(sale.unitPriceToman)}</td>
                    <td>{numberFormatter.format(sale.totalPriceToman)}</td>
                    <td>{numberFormatter.format(getSaleDiscountToman(sale))}</td>
                    <td>{numberFormatter.format(getSalePaidTotalToman(sale))}</td>
                    <td>{numberFormatter.format(getSaleProfitToman(sale))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
