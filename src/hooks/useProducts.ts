import { useCallback, useEffect, useState } from 'react';
import { getProducts } from '../db/productRepository';
import type { Product } from '../types/models';
import { getErrorMessage } from '../utils/errors';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshProducts = useCallback(async () => {
    try {
      setProducts(await getProducts());
    } catch (err) {
      setError(`خواندن محصولات ناموفق بود: ${getErrorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshProducts();
  }, [refreshProducts]);

  return { products, loading, error, setError, refreshProducts };
}
