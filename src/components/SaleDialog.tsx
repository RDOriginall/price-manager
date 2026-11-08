import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import type { ExchangeRate, Product } from '../types/models';
import { calculateDiscountToman, type DiscountMode } from '../utils/discount';
import { getErrorMessage } from '../utils/errors';
import { numberFormatter } from '../utils/format';
import { getFinalUnitPriceToman, normalizeNumberInput } from '../utils/price';

const MODES: { id: DiscountMode; label: string; placeholder: string }[] = [
  { id: 'percent', label: 'درصد', placeholder: 'مثلاً ۱۰' },
  { id: 'amount', label: 'مبلغ تخفیف', placeholder: 'مبلغ تخفیف به تومان' },
  { id: 'finalAmount', label: 'مبلغ نهایی', placeholder: 'مبلغ دریافتی به تومان' },
];

interface SaleDialogProps {
  product: Product;
  rate: ExchangeRate | undefined;
  onClose: () => void;
  onConfirm: (sale: { quantity: number; discountToman: number }) => Promise<void>;
}

function parseQuantity(input: string): number | null {
  const value = normalizeNumberInput(input);
  return /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value)) ? Number(value) : null;
}

export function SaleDialog({ product, rate, onClose, onConfirm }: SaleDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [quantityInput, setQuantityInput] = useState('1');
  const [mode, setMode] = useState<DiscountMode>('percent');
  const [discountInput, setDiscountInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const stock = product.stockQuantity ?? 0;
  const quantity = parseQuantity(quantityInput);
  const unitPrice = getFinalUnitPriceToman(product, rate);
  const lineTotal = unitPrice !== null && quantity !== null ? unitPrice * quantity : null;

  const discount = useMemo(() => {
    if (lineTotal === null) return { value: 0, error: '' };

    try {
      return { value: calculateDiscountToman(mode, discountInput, lineTotal), error: '' };
    } catch (error) {
      return { value: 0, error: getErrorMessage(error) };
    }
  }, [mode, discountInput, lineTotal]);

  const quantityError =
    quantity === null
      ? 'تعداد باید عدد صحیح و مثبت باشد.'
      : quantity > stock
        ? `موجودی کافی نیست (موجودی فعلی: ${numberFormatter.format(stock)}).`
        : '';

  const canSubmit =
    !saving && unitPrice !== null && quantity !== null && !quantityError && !discount.error;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || quantity === null) return;

    setSaving(true);
    setSubmitError('');

    try {
      await onConfirm({ quantity, discountToman: discount.value });
    } catch (error) {
      setSubmitError(getErrorMessage(error));
      setSaving(false);
    }
  }

  function selectMode(nextMode: DiscountMode) {
    setMode(nextMode);
    setDiscountInput('');
  }

  const money = (value: number | null) =>
    value === null ? '—' : `${numberFormatter.format(value)} تومان`;

  const currentMode = MODES.find((item) => item.id === mode) ?? MODES[0];
  const errorText =
    unitPrice === null
      ? 'برای این ارز هنوز نرخ ثبت نشده است. ابتدا نرخ را در بخش نرخ ارز وارد کنید.'
      : quantityError || discount.error || submitError;

  return (
    <dialog
      ref={dialogRef}
      className='sale-dialog'
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form className='sale-dialog-body sale-form' onSubmit={handleSubmit}>
        <div className='section-heading'>
          <div>
            <h2>ثبت فروش</h2>
            <p>{product.name}</p>
          </div>
        </div>

        <label>
          تعداد
          <input
            type='text'
            inputMode='numeric'
            value={quantityInput}
            onChange={(event) => setQuantityInput(event.target.value)}
          />
        </label>

        <div>
          <p className='sale-field-title'>تخفیف (اختیاری)</p>
          <div className='segment-group' role='group' aria-label='نوع تخفیف'>
            {MODES.map((item) => (
              <button
                key={item.id}
                type='button'
                className='segment'
                aria-pressed={mode === item.id}
                onClick={() => selectMode(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <input
            type='text'
            inputMode='decimal'
            value={discountInput}
            onChange={(event) => setDiscountInput(event.target.value)}
            placeholder={currentMode.placeholder}
            aria-label='مقدار تخفیف'
          />
        </div>

        <div className='sale-summary'>
          <div>
            <span>قیمت واحد</span>
            <span>{money(unitPrice)}</span>
          </div>
          <div>
            <span>جمع قبل از تخفیف</span>
            <span>{money(lineTotal)}</span>
          </div>
          <div>
            <span>تخفیف</span>
            <span>{money(lineTotal === null ? null : discount.value)}</span>
          </div>
          <div className='sale-total'>
            <span>مبلغ پس از تخفیف</span>
            <span>{money(lineTotal === null ? null : lineTotal - discount.value)}</span>
          </div>
        </div>

        {errorText && (
          <p className='error-message' role='alert'>
            {errorText}
          </p>
        )}

        <div className='form-actions'>
          <button type='submit' disabled={!canSubmit}>
            {saving ? 'در حال ثبت...' : 'ثبت فروش'}
          </button>
          <button type='button' className='secondary-button' onClick={onClose}>
            انصراف
          </button>
        </div>
      </form>
    </dialog>
  );
}
