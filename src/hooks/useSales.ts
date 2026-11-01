import { useCallback, useEffect, useState } from 'react';
import { getSalesHistory } from '../db/salesRepository';
import type { SaleRecord } from '../types/models';
import { getErrorMessage } from '../utils/errors';

export function useSales(onError: (message: string) => void) {
  const [sales, setSales] = useState<SaleRecord[]>([]);

  const refreshSales = useCallback(async () => {
    try {
      setSales(await getSalesHistory());
    } catch (err) {
      onError(`خواندن تاریخچه فروش ناموفق بود: ${getErrorMessage(err)}`);
    }
  }, [onError]);

  useEffect(() => {
    void refreshSales();
  }, [refreshSales]);

  return { sales, refreshSales };
}
