import { describe, expect, it } from 'vitest';
import {
  addProduct,
  adjustAllProductPrices,
  getProductById,
  setProductStock,
  updateProduct,
} from './productRepository';

const base = { name: 'Lipstick', currencyCode: 'USD', foreignPriceMinor: 1250 } as const;

describe('productRepository', () => {
  it('creates products with zero stock and a neutral multiplier', async () => {
    const id = await addProduct({ ...base, code: 'A1' });
    const product = await getProductById(id);
    expect(product?.stockQuantity).toBe(0);
    expect(product?.priceMultiplierBps).toBe(10000);
  });

  it('rejects empty names and invalid prices', async () => {
    await expect(addProduct({ ...base, name: '  ' })).rejects.toThrow();
    await expect(addProduct({ ...base, foreignPriceMinor: 12.5 })).rejects.toThrow();
    await expect(addProduct({ ...base, foreignPriceMinor: -1 })).rejects.toThrow();
  });

  it('keeps product codes unique', async () => {
    const first = await addProduct({ ...base, code: 'A1' });
    await expect(addProduct({ ...base, code: 'A1' })).rejects.toThrow();

    const second = await addProduct({ ...base, code: 'B2' });
    await expect(updateProduct(second, { code: 'A1' })).rejects.toThrow();
    await expect(updateProduct(first, { name: 'Renamed' })).resolves.toBeUndefined();
  });

  it('sets stock only to non-negative integers', async () => {
    const id = await addProduct(base);
    await setProductStock(id, 5);
    expect((await getProductById(id))?.stockQuantity).toBe(5);
    await expect(setProductStock(id, -1)).rejects.toThrow();
    await expect(setProductStock(id, 1.5)).rejects.toThrow();
  });

  it('adjusts all prices by a percentage', async () => {
    const a = await addProduct(base);
    const b = await addProduct({ ...base, name: 'Mascara' });
    await adjustAllProductPrices(10);
    expect((await getProductById(a))?.priceMultiplierBps).toBe(11000);
    expect((await getProductById(b))?.priceMultiplierBps).toBe(11000);
    await adjustAllProductPrices(-50);
    expect((await getProductById(a))?.priceMultiplierBps).toBe(5500);
    await expect(adjustAllProductPrices(-101)).rejects.toThrow();
  });

  it('stores a fractional multiplier from a typed final price', async () => {
    const id = await addProduct({ ...base, priceMultiplierBps: 11986.67 });
    expect((await getProductById(id))?.priceMultiplierBps).toBe(11986.67);
    await expect(addProduct({ ...base, name: 'Bad', priceMultiplierBps: 0 })).rejects.toThrow();
  });

  it('keeps the multiplier on update unless a new one is given', async () => {
    const id = await addProduct({ ...base, priceMultiplierBps: 12000 });

    await updateProduct(id, { name: 'Renamed' });
    expect((await getProductById(id))?.priceMultiplierBps).toBe(12000);

    await updateProduct(id, { priceMultiplierBps: 9000 });
    expect((await getProductById(id))?.priceMultiplierBps).toBe(9000);
  });
});
