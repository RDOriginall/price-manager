import { useState, type FormEvent } from 'react';
import { CURRENCIES } from '../data/currenties';
import type { CurrencyCode } from '../data/currenties';
import { formatCurrencyOption } from '../data/currencyLabels';
import type { ExchangeRate } from '../types/models';
import { dateFormatter, numberFormatter } from '../utils/format';

interface RatesTabProps {
  active: boolean;
  rates: ExchangeRate[];
  rateError: string;
  onSaveRate: (currencyCode: CurrencyCode, input: string) => Promise<boolean>;
}

export function RatesTab({ active, rates, rateError, onSaveRate }: RatesTabProps) {
  const [rateCurrencyCode, setRateCurrencyCode] = useState<CurrencyCode>('USD');
  const [rateInput, setRateInput] = useState('');
  const [savingRate, setSavingRate] = useState(false);

  async function handleRateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingRate(true);

    const saved = await onSaveRate(rateCurrencyCode, rateInput);
    if (saved) setRateInput('');

    setSavingRate(false);
  }

  return (
    <section className='panel' hidden={!active}>
      <div className='section-heading'>
        <div>
          <h2>مدیریت نرخ ارز</h2>
          <p>نرخ هر واحد ارز را به تومان وارد کنید، مثلا نرخ یک دلار</p>
        </div>
      </div>

      <form className='product-form' onSubmit={handleRateSubmit}>
        <label>
          ارز
          <select
            value={rateCurrencyCode}
            onChange={(event) => setRateCurrencyCode(event.target.value as CurrencyCode)}
          >
            {CURRENCIES.filter((currency) => currency.code !== 'Toman').map((currency) => (
              <option key={currency.code} value={currency.code}>
                {formatCurrencyOption(currency.code)}
              </option>
            ))}
          </select>
        </label>

        <label>
          نرخ هر ارز به تومان
          <input
            required
            type='number'
            min='1'
            step='1'
            inputMode='numeric'
            value={rateInput}
            onChange={(event) => setRateInput(event.target.value)}
            placeholder='مثلا 274000'
          />
        </label>

        {rateError && (
          <p className='error-message' role='alert'>
            {rateError}
          </p>
        )}

        <div className='form-actions'>
          <button type='submit' disabled={savingRate}>
            {savingRate ? 'درحال ذخیره سازی' : 'ذخیره نرخ ارز'}
          </button>
        </div>
      </form>

      <div className='table-wrapper'>
        <table>
          <thead>
            <tr>
              <th>ارز</th>
              <th>نرخ به تومان</th>
              <th>آخرین به‌روزرسانی</th>
              <th>منبع</th>
            </tr>
          </thead>
          <tbody>
            {rates.length === 0 ? (
              <tr>
                <td colSpan={4} className='empty-state'>
                  هنوز نرخ ارزی ثبت نکرده‌اید
                </td>
              </tr>
            ) : (
              rates.map((rate) => (
                <tr key={rate.currencyCode}>
                  <td>{formatCurrencyOption(rate.currencyCode)}</td>
                  <td>{numberFormatter.format(rate.rateToToman)} تومان</td>
                  <td>{dateFormatter.format(new Date(rate.updatedAt))}</td>
                  <td>{rate.source === 'manual' ? 'دستی' : 'آنلاین'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
