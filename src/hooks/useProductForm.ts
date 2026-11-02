import { useState, type FormEvent } from 'react';
import type { CurrencyCode } from '../data/currenties';
import { addProduct, updateProduct } from '../db/productRepository';
import type { ExchangeRate, Product } from '../types/models';
import { getErrorMessage } from '../utils/errors';
import {
  calculateMultiplierForFinalPrice,
  formatForeignPrice,
  getBaseTomanPrice,
  normalizeNumberInput,
  parsePriceToMinor,
} from '../utils/price';

export type ProductFormValues = {
  name: string;
  code: string;
  currencyCode: CurrencyCode;
  foreignPriceMinor: string;
  finalPriceToman: string;
};

export const INITIAL_FORM: ProductFormValues = {
  name: '',
  code: '',
  currencyCode: 'USD',
  foreignPriceMinor: '',
  finalPriceToman: '',
};

interface Options {
  refreshProducts: () => Promise<void>;
  setError: (message: string) => void;
  rates: ExchangeRate[];
}

export function useProductForm({ refreshProducts, setError, rates }: Options) {
  const [form, setForm] = useState<ProductFormValues>(INITIAL_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setError('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSaving(true);

    try {
      const foreignPriceMinor = parsePriceToMinor(form.foreignPriceMinor, form.currencyCode);

      const product = {
        name: form.name.trim(),
        code: form.code.trim() || undefined,
        currencyCode: form.currencyCode,
        foreignPriceMinor,
      };

      // A typed final price becomes the product's price multiplier. When the field is left
      // empty, an existing product keeps its current percentage.
      const finalPriceInput = normalizeNumberInput(form.finalPriceToman);
      let priceMultiplierBps: number | undefined;

      if (finalPriceInput) {
        const rate = rates.find((item) => item.currencyCode === form.currencyCode);
        const baseToman = getBaseTomanPrice(
          { currencyCode: form.currencyCode, foreignPriceMinor },
          rate,
        );

        if (baseToman === null) {
          throw new Error('برای تعیین قیمت نهایی، ابتدا نرخ این ارز را در بخش نرخ ارز ثبت کنید.');
        }

        priceMultiplierBps = calculateMultiplierForFinalPrice(
          baseToman,
          parsePriceToMinor(finalPriceInput, 'Toman'),
        );
      }

      const payload =
        priceMultiplierBps === undefined ? product : { ...product, priceMultiplierBps };

      if (editingId === null) {
        await addProduct(payload);
      } else {
        await updateProduct(editingId, payload);
      }

      resetForm();
      await refreshProducts();
    } catch (err) {
      setError(`ذخیره محصول ناموفق بود: ${getErrorMessage(err)}`);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(product: Product) {
    if (product.id === undefined) {
      setError('محصول انتخاب شده فاقد شناسه است و نمی‌توان آن را ویرایش کرد');
      return;
    }

    setEditingId(product.id);
    setForm({
      name: product.name,
      code: product.code ?? '',
      currencyCode: product.currencyCode,
      foreignPriceMinor: formatForeignPrice(product.foreignPriceMinor, product.currencyCode),
      finalPriceToman: '',
    });
    setError('');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return { form, setForm, editingId, saving, resetForm, handleSubmit, handleEdit };
}
