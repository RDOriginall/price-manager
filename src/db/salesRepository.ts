
import { db } from './database';
import type { SaleRecord } from '../types/models';

export interface RecordSaleInput {
  productId: number;
  quantity: number;
}

export async function recordSale(
  input: RecordSaleInput,
): Promise<number> {
  if (
    !Number.isSafeInteger(input.productId) ||
    input.productId <= 0
  ) {
    throw new Error('شناسه محصول نامعتبر است.');
  }

  if (
    !Number.isSafeInteger(input.quantity) ||
    input.quantity <= 0
  ) {
    throw new Error('تعداد فروش باید عدد صحیح و مثبت باشد.');
  }

  return db.transaction(
    'rw',
    db.products,
    db.exchangeRates,
    db.sales,
    async () => {
      const product = await db.products.get(input.productId);

      if (!product) {
        throw new Error('محصول موردنظر پیدا نشد.');
      }

      const currentStock = product.stockQuantity ?? 0;

      if (currentStock < input.quantity) {
        throw new Error(
          `${currentStock} :موجودی کافی نیست، موجودی فعلی`,
        );
      }

      const rate =
        product.currencyCode === 'Toman'
          ? undefined
          : await db.exchangeRates.get(product.currencyCode);

      const multiplier = product.priceMultiplierBps ?? 10000;

      const basePriceToman =
        product.currencyCode === 'Toman'
          ? product.foreignPriceMinor
          : rate
            ? Math.round(
                (product.foreignPriceMinor * rate.rateToToman) /
                  100,
              )
            : null;

      if (basePriceToman === null) {
        throw new Error('برای این ارز هنوز نرخ تبدیل ثبت نشده است.');
      }

      const unitPriceToman = Math.round(
        (basePriceToman * multiplier) / 10000,
      );

      const totalPriceToman = unitPriceToman * input.quantity;

      if (
        !Number.isSafeInteger(unitPriceToman) ||
        !Number.isSafeInteger(totalPriceToman)
      ) {
        throw new Error('مبلغ فروش بیش از محدوده مجاز است.');
      }

      const sale: SaleRecord = {
        productId: input.productId,
        productName: product.name,
        productCode: product.code,
        quantity: input.quantity,
        currencyCode: product.currencyCode,
        productPriceMinorAtSale: product.foreignPriceMinor,
        priceMultiplierBpsAtSale: multiplier,
        exchangeRateToToman:
          product.currencyCode === 'Toman'
            ? null
            : rate?.rateToToman ?? null,
        unitPriceToman,
        totalPriceToman,
        soldAt: new Date().toISOString(),
      };

      const saleId = await db.sales.add(sale);

      await db.products.update(input.productId, {
        stockQuantity: currentStock - input.quantity,
        updatedAt: new Date().toISOString(),
      });

      return saleId;
    },
  );
}

export async function getSalesHistory(): Promise<SaleRecord[]> {
  return db.sales.orderBy('soldAt').reverse().toArray();
}
