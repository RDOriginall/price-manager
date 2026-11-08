import { describe, expect, it } from 'vitest';
import { saveManualExchangeRate } from './exchangeRateRepository';
import {
  addProduct,
  getProductById,
  setProductPriceMultiplier,
  setProductStock,
} from './productRepository';
import { getSalesHistory, recordSale } from './salesRepository';

describe('recordSale', () => {
  it('decreases stock and snapshots the price at sale time', async () => {
    await saveManualExchangeRate('USD', 60000);
    const id = await addProduct({ name: 'Perfume', currencyCode: 'USD', foreignPriceMinor: 1250 });
    await setProductStock(id, 10);
    await setProductPriceMultiplier(id, 10);

    await recordSale({ productId: id, quantity: 2 });

    expect((await getProductById(id))?.stockQuantity).toBe(8);

    const [sale] = await getSalesHistory();
    expect(sale.unitPriceToman).toBe(825000);
    expect(sale.totalPriceToman).toBe(1650000);
    expect(sale.exchangeRateToToman).toBe(60000);
    expect(sale.productName).toBe('Perfume');
  });

  it('does not change past sales when prices change later', async () => {
    await saveManualExchangeRate('USD', 60000);
    const id = await addProduct({ name: 'Cream', currencyCode: 'USD', foreignPriceMinor: 1000 });
    await setProductStock(id, 5);
    await recordSale({ productId: id, quantity: 1 });

    await saveManualExchangeRate('USD', 90000);

    const [sale] = await getSalesHistory();
    expect(sale.unitPriceToman).toBe(600000);
  });

  it('uses the price directly for Toman products', async () => {
    const id = await addProduct({ name: 'Pin', currencyCode: 'Toman', foreignPriceMinor: 50000 });
    await setProductStock(id, 3);
    await recordSale({ productId: id, quantity: 2 });

    const [sale] = await getSalesHistory();
    expect(sale.unitPriceToman).toBe(50000);
    expect(sale.totalPriceToman).toBe(100000);
    expect(sale.exchangeRateToToman).toBeNull();
  });

  it('fails atomically when stock is not enough', async () => {
    await saveManualExchangeRate('USD', 60000);
    const id = await addProduct({ name: 'Brush', currencyCode: 'USD', foreignPriceMinor: 500 });
    await setProductStock(id, 1);

    await expect(recordSale({ productId: id, quantity: 2 })).rejects.toThrow();

    expect((await getProductById(id))?.stockQuantity).toBe(1);
    expect(await getSalesHistory()).toHaveLength(0);
  });

  it('refuses to sell a foreign-priced product without an exchange rate', async () => {
    const id = await addProduct({ name: 'Bag', currencyCode: 'EUR', foreignPriceMinor: 2000 });
    await setProductStock(id, 1);

    await expect(recordSale({ productId: id, quantity: 1 })).rejects.toThrow();
    expect((await getProductById(id))?.stockQuantity).toBe(1);
  });

  it('rejects invalid quantities', async () => {
    const id = await addProduct({ name: 'Pin', currencyCode: 'Toman', foreignPriceMinor: 100 });
    await setProductStock(id, 5);
    await expect(recordSale({ productId: id, quantity: 0 })).rejects.toThrow();
    await expect(recordSale({ productId: id, quantity: 1.5 })).rejects.toThrow();
  });

  it('sells at the exact final price typed by the user', async () => {
    await saveManualExchangeRate('USD', 60000);
    const id = await addProduct({
      name: 'Serum',
      currencyCode: 'USD',
      foreignPriceMinor: 1250,
      priceMultiplierBps: (899000 / 750000) * 10000,
    });
    await setProductStock(id, 2);
    await recordSale({ productId: id, quantity: 2 });

    const [sale] = await getSalesHistory();
    expect(sale.unitPriceToman).toBe(899000);
    expect(sale.totalPriceToman).toBe(1798000);
  });

  it('records a discount and keeps the price before the discount', async () => {
    await saveManualExchangeRate('USD', 60000);
    const id = await addProduct({ name: 'Cream', currencyCode: 'USD', foreignPriceMinor: 1000 });
    await setProductStock(id, 5);

    await recordSale({ productId: id, quantity: 2, discountToman: 100000 });

    const [sale] = await getSalesHistory();
    expect(sale.totalPriceToman).toBe(1200000);
    expect(sale.discountToman).toBe(100000);
    expect((await getProductById(id))?.stockQuantity).toBe(3);
  });

  it('does not store a discount field when there is no discount', async () => {
    const id = await addProduct({ name: 'Pin', currencyCode: 'Toman', foreignPriceMinor: 1000 });
    await setProductStock(id, 5);

    await recordSale({ productId: id, quantity: 1, discountToman: 0 });

    const [sale] = await getSalesHistory();
    expect(sale.discountToman).toBeUndefined();
  });

  it('rejects an invalid discount without changing stock or history', async () => {
    const id = await addProduct({ name: 'Pin', currencyCode: 'Toman', foreignPriceMinor: 1000 });
    await setProductStock(id, 5);

    await expect(recordSale({ productId: id, quantity: 1, discountToman: 1001 })).rejects.toThrow();
    await expect(recordSale({ productId: id, quantity: 1, discountToman: -1 })).rejects.toThrow();
    await expect(recordSale({ productId: id, quantity: 1, discountToman: 10.5 })).rejects.toThrow();

    expect((await getProductById(id))?.stockQuantity).toBe(5);
    expect(await getSalesHistory()).toHaveLength(0);
  });
});
