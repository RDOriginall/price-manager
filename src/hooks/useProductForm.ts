import { useState, type FormEvent } from 'react';
import type { CurrencyCode } from '../data/currenties';
import { addProduct, updateProduct } from '../db/productRepository';
import type { Product } from '../types/models';
import { getErrorMessage } from '../utils/errors';
import { formatForeignPrice, parsePriceToMinor } from '../utils/price';

export type ProductFormValues = {
  name: string;
  code: string;
  currencyCode: CurrencyCode;
  foreignPriceMinor: string;
};

export const INITIAL_FORM: ProductFormValues = {
  name: '',
  code: '',
  currencyCode: 'USD',
  foreignPriceMinor: '',
};

interface Options {
  refreshProducts: () => Promise<void>;
  setError: (message: string) => void;
}

export function useProductForm({ refreshProducts, setError }: Options) {
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
      const product = {
        name: form.name.trim(),
        code: form.code.trim() || undefined,
        currencyCode: form.currencyCode,
        foreignPriceMinor: parsePriceToMinor(form.foreignPriceMinor, form.currencyCode),
      };

      if (editingId === null) {
        await addProduct(product);
      } else {
        await updateProduct(editingId, product);
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
    });
    setError('');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return { form, setForm, editingId, saving, resetForm, handleSubmit, handleEdit };
}
