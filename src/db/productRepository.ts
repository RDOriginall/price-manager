import { db } from './database';
import type { Product } from '../types/models';

export type newProduct = Pick<Product, 'code' | 'name' | 'currencyCode' | 'foreignPriceMinor'> &
    Partial<Pick<Product, 'priceMultiplierBps'>>;

export type ProductChanges = Partial<newProduct>;

function normalizeCode(code?: string): string | undefined {
    const normalized = code?.trim();
    return normalized || undefined;
}


function validateProduct(Product: Pick<Product, 'name' | 'foreignPriceMinor'>,
        ): void {
            if (!Product.name.trim()) {
                throw new Error('Product name cannot be empty');
            }
            if (
                !Number.isSafeInteger(Product.foreignPriceMinor) ||
                Product.foreignPriceMinor < 0
            ) {
                throw new Error('foreignPriceMinor must be a non-negative integer'
            );
            }
        }
        

/** The multiplier is in basis points and may be fractional (set from a typed final price). */
function validateMultiplier(multiplier: number | undefined): void {
    if (multiplier !== undefined && (!Number.isFinite(multiplier) || multiplier <= 0)) {
        throw new Error('ضریب قیمت باید عددی بزرگ‌تر از صفر باشد.');
    }
}

async function ensureCodeIsUnique(
    code: string | undefined,
    excludeId?: number,
): Promise<void> {
    if (!code) return;

    const existing = await db.products.where('code').equals(code).first();

    if (existing && existing.id !== excludeId) {
        throw new Error(`Product code "${code}" already exists`);
    }
}


export async function addProduct(
    input: newProduct,
): Promise<number> {
    const product = {
        ...input,
        name: input.name.trim(),
        code: normalizeCode(input.code),
    };

    validateProduct(product);
    validateMultiplier(product.priceMultiplierBps);
    await ensureCodeIsUnique(product.code);

    const now = new Date().toISOString();

    return db.products.add({
        ...product,
        stockQuantity: 0,
        priceMultiplierBps: input.priceMultiplierBps ?? 10000,
        createdAt: now,
        updatedAt: now,
    });
}


export async function getProducts(): Promise<Product[]> {
  const products = await db.products.toArray();

  return products.sort((a, b) => {
    return (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '');
  });
}

// export async function countProducts(): Promise<number> {
//   return db.products.count();
// }

export async function getProductById(id: number,):
    Promise<Product | undefined> {
        return db.products.get(id);
    }


export async function updateProduct(
    id: number,
    changes: ProductChanges,
): Promise<void> {
    const existing = await db.products.get(id);

    if (!existing) {
        throw new Error(`Product with id ${id} not found`);
    }

    const updated: Product = {
        ...existing,
        ...changes,
        name: (changes.name ?? existing.name).trim(),
        code: normalizeCode(changes.code ?? existing.code),
        priceMultiplierBps: changes.priceMultiplierBps ?? existing.priceMultiplierBps,
        updatedAt: new Date().toISOString(),
    };

    validateProduct(updated);
    validateMultiplier(changes.priceMultiplierBps);
    await ensureCodeIsUnique(updated.code, id);

    await db.products.put(updated);
}

export async function deleteProduct(id: number): Promise<void> {
    await db.products.delete(id);
}


export async function setProductStock(
  productId: number,
  quantity: number,
): Promise<void> {
  if (!Number.isSafeInteger(quantity) || quantity < 0) {
    throw new Error('موجودی باید عدد صحیح و نامنفی باشد.');
  }

  const product = await db.products.get(productId);

  if (!product) {
    throw new Error('محصول موردنظر پیدا نشد.');
  }

  await db.products.update(productId, {
    stockQuantity: quantity,
    updatedAt: new Date().toISOString(),
  });
}



export async function setProductPriceMultiplier(
  productId: number,
  percent: number,
): Promise<void> {
  if (!Number.isFinite(percent) || percent < -100) {
    throw new Error('درصد تغییر قیمت نمی‌تواند کمتر از ۱۰۰- باشد.');
  }

  const product = await db.products.get(productId);

  if (!product) {
    throw new Error('محصول موردنظر پیدا نشد.');
  }

  const multiplier = Math.round((100 + percent) * 100);

  if (!Number.isSafeInteger(multiplier) || multiplier < 0) {
    throw new Error('درصد واردشده نامعتبر است.');
  }

  await db.products.update(productId, {
    priceMultiplierBps: multiplier,
    updatedAt: new Date().toISOString(),
  });
}



export async function adjustAllProductPrices(
  percent: number,
): Promise<void> {
  if (!Number.isFinite(percent) || percent < -100) {
    throw new Error('درصد تغییر قیمت باید عددی معتبر و حداقل ۱۰۰- باشد.');
  }

  await db.transaction('rw', db.products, async () => {
    const products = await db.products.toArray();

    const adjustmentFactor = 1 + percent / 100;

    for (const product of products) {
      if (product.id === undefined) continue;

      const currentMultiplier = product.priceMultiplierBps ?? 10000;
      const newMultiplier = Math.round(
        currentMultiplier * adjustmentFactor,
      );

      if (
        !Number.isSafeInteger(newMultiplier) ||
        newMultiplier < 0
      ) {
        throw new Error(
          `ضریب قیمت محصول «${product.name}» بیش از محدوده مجاز است.`,
        );
      }

      await db.products.update(product.id, {
        priceMultiplierBps: newMultiplier,
        updatedAt: new Date().toISOString(),
      });
    }
  });
}
