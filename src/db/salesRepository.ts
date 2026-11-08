import type { SaleRecord } from '../types/models';
import { getFinalUnitPriceToman } from '../utils/price';
import { db } from './database';

export interface RecordSaleInput {
  productId: number;
  quantity: number;
  /** Total discount for this sale line in Toman. Omit or pass 0 for no discount. */
  discountToman?: number;
}

export async function recordSale(input: RecordSaleInput): Promise<number> {
  if (!Number.isSafeInteger(input.productId) || input.productId <= 0) {
    throw new Error('شناسه محصول نامعتبر است.');
  }

  if (!Number.isSafeInteger(input.quantity) || input.quantity <= 0) {
    throw new Error('تعداد فروش باید عدد صحیح و مثبت باشد.');
  }

  const discountToman = input.discountToman ?? 0;

  if (!Number.isSafeInteger(discountToman) || discountToman < 0) {
    throw new Error('مبلغ تخفیف باید عدد صحیح و نامنفی باشد.');
  }

  return db.transaction('rw', db.products, db.exchangeRates, db.sales, async () => {
    const product = await db.products.get(input.productId);

    if (!product) {
      throw new Error('محصول موردنظر پیدا نشد.');
    }

    const currentStock = product.stockQuantity ?? 0;

    if (currentStock < input.quantity) {
      throw new Error(`${currentStock} :موجودی کافی نیست، موجودی فعلی`);
    }

    const rate =
      product.currencyCode === 'Toman'
        ? undefined
        : await db.exchangeRates.get(product.currencyCode);

    const unitPriceToman = getFinalUnitPriceToman(product, rate);

    if (unitPriceToman === null) {
      throw new Error('برای این ارز هنوز نرخ تبدیل ثبت نشده است.');
    }

    const totalPriceToman = unitPriceToman * input.quantity;

    if (!Number.isSafeInteger(unitPriceToman) || !Number.isSafeInteger(totalPriceToman)) {
      throw new Error('مبلغ فروش بیش از محدوده مجاز است.');
    }

    if (discountToman > totalPriceToman) {
      throw new Error('مبلغ تخفیف نمی‌تواند از مبلغ کل فروش بیشتر باشد.');
    }

    const sale: SaleRecord = {
      productId: input.productId,
      productName: product.name,
      productCode: product.code,
      quantity: input.quantity,
      currencyCode: product.currencyCode,
      productPriceMinorAtSale: product.foreignPriceMinor,
      priceMultiplierBpsAtSale: product.priceMultiplierBps ?? 10000,
      exchangeRateToToman: product.currencyCode === 'Toman' ? null : (rate?.rateToToman ?? null),
      unitPriceToman,
      totalPriceToman,
      ...(discountToman > 0 ? { discountToman } : {}),
      soldAt: new Date().toISOString(),
    };

    const saleId = await db.sales.add(sale);

    await db.products.update(input.productId, {
      stockQuantity: currentStock - input.quantity,
      updatedAt: new Date().toISOString(),
    });

    return saleId;
  });
}

export async function getSalesHistory(): Promise<SaleRecord[]> {
  return db.sales.orderBy('soldAt').reverse().toArray();
}
