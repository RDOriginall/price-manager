import type { FormEvent } from 'react';
import { CURRENCIES } from '../data/currenties';
import type { CurrencyCode } from '../data/currenties';
import { CURRENCY_LABELS } from '../data/currencyLabels';
import type { ProductFormValues } from '../hooks/useProductForm';

interface ProductFormTabProps {
  active: boolean;
  form: ProductFormValues;
  setForm: (form: ProductFormValues) => void;
  editingId: number | null;
  saving: boolean;
  error: string;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  resetForm: () => void;
}

export function ProductFormTab({
  active,
  form,
  setForm,
  editingId,
  saving,
  error,
  handleSubmit,
  resetForm,
}: ProductFormTabProps) {
  return (
    <section className='panel' hidden={!active}>
      <div className='section-heading'>
        <div>
          <h2>{editingId === null ? 'افزودن محصول' : 'ویرایش محصول'}</h2>
          <p>قیمت محصول را به ارز انتخابی وارد کنید</p>
        </div>
      </div>

      <form className='product-form' onSubmit={handleSubmit}>
        <label>
          نام محصول
          <input
            required
            maxLength={150}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder='نام محصول را وارد کنید'
          />
        </label>

        <label>
          کد محصول (اختیاری)
          <input
            maxLength={80}
            value={form.code}
            onChange={(event) => setForm({ ...form, code: event.target.value })}
            placeholder='کد محصول را وارد کنید'
          />
        </label>

        <label>
          واحد پول
          <select
            value={form.currencyCode}
            onChange={(event) =>
              setForm({ ...form, currencyCode: event.target.value as CurrencyCode })
            }
          >
            {CURRENCIES.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {CURRENCY_LABELS[currency.code]} ({currency.code})
              </option>
            ))}
          </select>
        </label>

        <label>
          قیمت اصلی
          <input
            required
            type='text'
            inputMode='decimal'
            value={form.foreignPriceMinor}
            onChange={(event) => setForm({ ...form, foreignPriceMinor: event.target.value })}
            placeholder='قیمت محصول را وارد کنید'
          />
        </label>

        <label>
          قیمت نهایی به تومان (اختیاری)
          <input
            type='text'
            inputMode='numeric'
            value={form.finalPriceToman}
            onChange={(event) => setForm({ ...form, finalPriceToman: event.target.value })}
            placeholder='خالی = حفظ درصد فعلی'
          />
        </label>

        {error && (
          <p className='error-message' role='alert'>
            {' '}
            {error}{' '}
          </p>
        )}

        <div className='form-actions'>
          <button type='submit' disabled={saving}>
            {saving ? 'در حال ذخیره' : editingId === null ? 'ذخیره محصول' : 'ذخیره تغییرات'}
          </button>

          {editingId !== null && (
            <button type='button' className='secondary-button' onClick={resetForm}>
              انصراف از ویرایش
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
