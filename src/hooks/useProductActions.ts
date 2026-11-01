import {
  adjustAllProductPrices,
  deleteProduct,
  setProductPriceMultiplier,
  setProductStock,
} from '../db/productRepository';
import { getSalesHistory, recordSale } from '../db/salesRepository';
import type { Product } from '../types/models';
import { getErrorMessage } from '../utils/errors';

interface Options {
  products: Product[];
  editingId: number | null;
  resetForm: () => void;
  refreshProducts: () => Promise<void>;
  refreshSales: () => Promise<void>;
  setError: (message: string) => void;
}

export function useProductActions({
  products,
  editingId,
  resetForm,
  refreshProducts,
  refreshSales,
  setError,
}: Options) {
  async function handleDelete(product: Product) {
    if (product.id === undefined) {
      setError('محصول انتخاب شده فاقد شناسه است و نمی‌توان آن را حذف کرد');
      return;
    }

    const confirmed = window.confirm(`آیا از حذف محصول "${product.name}" اطمینان دارید؟`);
    if (!confirmed) return;

    setError('');

    try {
      await deleteProduct(product.id);

      if (editingId === product.id) {
        resetForm();
      }
      await refreshProducts();
    } catch (err) {
      setError(`حذف محصول ناموفق بود: ${getErrorMessage(err)}`);
    }
  }

  async function handleSetStock(product: Product) {
    if (product.id === undefined) {
      setError('شناسه محصول نامعتبر است.');
      return;
    }

    const input = window.prompt(
      `موجودی جدید برای «${product.name}» را وارد کنید:`,
      String(product.stockQuantity ?? 0),
    );

    if (input === null) return;

    const quantity = Number(input.trim());

    if (!/^\d+$/.test(input.trim()) || !Number.isSafeInteger(quantity)) {
      setError('موجودی باید یک عدد صحیح و نامنفی باشد.');
      return;
    }

    try {
      setError('');
      await setProductStock(product.id, quantity);
      await refreshProducts();
    } catch (err) {
      setError(`تنظیم موجودی ناموفق بود: ${getErrorMessage(err)}`);
    }
  }

  async function handleSell(product: Product) {
    if (product.id === undefined) {
      setError('شناسه محصول نامعتبر است.');
      return;
    }

    const input = window.prompt(`تعداد فروش برای «${product.name}» را وارد کنید:`, '1');

    if (input === null) return;

    const quantity = Number(input.trim());

    if (!/^[1-9]\d*$/.test(input.trim()) || !Number.isSafeInteger(quantity)) {
      setError('تعداد فروش باید عدد صحیح و مثبت باشد.');
      return;
    }

    try {
      setError('');
      await recordSale({
        productId: product.id,
        quantity,
      });

      await refreshProducts();
      await refreshSales();

      const history = await getSalesHistory();
      alert(`فروش ثبت شد.\nتعداد رکوردهای تاریخچه فروش: ${history.length}`);
    } catch (err) {
      setError(`ثبت فروش ناموفق بود: ${getErrorMessage(err)}`);
    }
  }

  const handleSetPriceAdjustment = async (product: Product) => {
    if (product.id === undefined) {
      setError('شناسه محصول نامعتبر است.');
      return;
    }

    const currentPercent = (product.priceMultiplierBps ?? 10000) / 100 - 100;

    const input = window.prompt(
      `درصد افزایش یا کاهش قیمت نهایی برای «${product.name}» را وارد کنید.\nمثلاً 15 برای افزایش 15 درصد یا -10 برای کاهش 10 درصد:`,
      String(currentPercent),
    );

    if (input === null) return;

    if (input.trim() === '') {
      setError('لطفاً یک درصد معتبر وارد کنید.');
      return;
    }

    const percent = Number(input);

    if (!Number.isFinite(percent) || percent < -100) {
      setError('درصد باید عددی معتبر و حداقل 100- باشد.');
      return;
    }

    try {
      await setProductPriceMultiplier(product.id, percent);
      await refreshProducts();
      setError('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'تغییر درصد قیمت انجام نشد.');
    }
  };

  const handleAdjustAllPrices = async () => {
    const input = window.prompt(
      'درصد تغییر قیمت همه محصولات را وارد کنید:\nمثلاً 15 برای افزایش 15٪ یا -10 برای کاهش 10٪',
    );

    if (input === null) return;

    if (input.trim() === '') {
      setError('لطفاً یک درصد معتبر وارد کنید.');
      return;
    }

    const percent = Number(input);

    if (!Number.isFinite(percent) || percent < -100) {
      setError('درصد باید عددی معتبر و حداقل 100- باشد.');
      return;
    }

    const confirmed = window.confirm(
      `آیا مطمئن هستید که می‌خواهید قیمت نهایی تمام ${products.length} محصول را ${percent > 0 ? `${percent}٪ افزایش` : percent < 0 ? `${Math.abs(percent)}٪ کاهش` : 'بدون تغییر'} دهید؟`,
    );

    if (!confirmed) return;

    try {
      await adjustAllProductPrices(percent);
      await refreshProducts();
      setError('');
      window.alert('قیمت محصولات با موفقیت به‌روزرسانی شد.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'تغییر کلی قیمت محصولات انجام نشد.');
    }
  };

  return {
    handleDelete,
    handleSetStock,
    handleSell,
    handleSetPriceAdjustment,
    handleAdjustAllPrices,
  };
}
