import { useCallback, useEffect, useState } from 'react';
import type { CurrencyCode } from '../data/currenties';
import { getAllExchangeRates, saveManualExchangeRate } from '../db/exchangeRateRepository';
import type { ExchangeRate } from '../types/models';
import { getErrorMessage } from '../utils/errors';

export function useExchangeRates() {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [rateError, setRateError] = useState('');

  const refreshRates = useCallback(async () => {
    try {
      setRates(await getAllExchangeRates());
    } catch (err) {
      setRateError(`خواندن نرخ‌ها ناموفق بود ${getErrorMessage(err)}`);
    }
  }, []);

  useEffect(() => {
    void refreshRates();
  }, [refreshRates]);

  /** Validates and saves a manual rate. Returns true when the rate was saved. */
  const saveRate = useCallback(
    async (currencyCode: CurrencyCode, input: string): Promise<boolean> => {
      setRateError('');

      try {
        const rate = Number(input.trim());

        if (!Number.isSafeInteger(rate) || rate <= 0) {
          throw new Error('نرخ ارز باید یک عدد صحیح مثبت به تومان باشد');
        }

        await saveManualExchangeRate(currencyCode, rate);
        await refreshRates();
        return true;
      } catch (err) {
        setRateError(getErrorMessage(err));
        return false;
      }
    },
    [refreshRates],
  );

  return { rates, rateError, saveRate };
}
