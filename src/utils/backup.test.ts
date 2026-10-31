import { describe, expect, it } from 'vitest';
import { db } from '../db/database';
import { saveManualExchangeRate } from '../db/exchangeRateRepository';
import { addProduct, getProducts, setProductStock } from '../db/productRepository';
import { getSalesHistory, recordSale } from '../db/salesRepository';
import { createBackup, importBackup } from './backup';

const toFile = (data: unknown) =>
  new File([JSON.stringify(data)], 'backup.json', { type: 'application/json' });

describe('backup', () => {
  it('restores products, rates and sales after a wipe', async () => {
    await saveManualExchangeRate('USD', 60000);
    const id = await addProduct({ name: 'Perfume', code: 'P1', currencyCode: 'USD', foreignPriceMinor: 1250 });
    await setProductStock(id, 4);
    await recordSale({ productId: id, quantity: 1 });

    const backup = await createBackup();
    await Promise.all(db.tables.map((table) => table.clear()));
    expect(await getProducts()).toHaveLength(0);

    await importBackup(toFile(backup));

    const [product] = await getProducts();
    expect(product.name).toBe('Perfume');
    expect(product.stockQuantity).toBe(3);
    expect(await getSalesHistory()).toHaveLength(1);
    expect(await db.exchangeRates.count()).toBe(1);
  });

  it('rejects files that are not valid backups', async () => {
    await expect(importBackup(toFile({ hello: 'world' }))).rejects.toThrow();
  });

  it('keeps existing data when the backup is invalid', async () => {
    await addProduct({ name: 'Keep me', currencyCode: 'Toman', foreignPriceMinor: 100 });
    await expect(importBackup(toFile({ app: 'price-manager' }))).rejects.toThrow();
    expect(await getProducts()).toHaveLength(1);
  });
});