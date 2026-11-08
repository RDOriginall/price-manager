import { Fragment, useMemo, useState } from 'react';
import { formatCurrencyCode } from '../data/currencyLabels';
import type { ExchangeRate, Product } from '../types/models';
import { SaleDialog } from './SaleDialog';
import { numberFormatter } from '../utils/format';
import { compareProductsByCode } from '../utils/productSort';
import {
  formatBaseTomanPrice,
  formatForeignPrice,
  formatTomanPrice,
  getPercentChange,
} from '../utils/price';

interface ProductsTabProps {
  active: boolean;
  products: Product[];
  loading: boolean;
  error: string;
  rates: ExchangeRate[];
  handleEdit: (product: Product) => void;
  handleDelete: (product: Product) => Promise<void>;
  handleSetStock: (product: Product) => Promise<void>;
  sellProduct: (
    product: Product,
    sale: { quantity: number; discountToman: number },
  ) => Promise<void>;
  handleSetPriceAdjustment: (product: Product) => Promise<void>;
  handleAdjustAllPrices: () => Promise<void>;
}

export function ProductsTab({
  active,
  products,
  loading,
  error,
  rates,
  handleEdit,
  handleDelete,
  handleSetStock,
  sellProduct,
  handleSetPriceAdjustment,
  handleAdjustAllPrices,
}: ProductsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProductId, setExpandedProductId] = useState<number | null>(null);
  const [sellingProduct, setSellingProduct] = useState<Product | null>(null);

  const ratesByCurrency = useMemo(
    () => new Map(rates.map((rate) => [rate.currencyCode, rate])),
    [rates],
  );

  const query = searchQuery.trim().toLocaleLowerCase();
  const sortedProducts = useMemo(() => [...products].sort(compareProductsByCode), [products]);

  const filteredProducts = sortedProducts.filter((product) => {
    if (!query) return true;

    const name = product.name.toLocaleLowerCase();
    const code = (product.code ?? '').toLocaleLowerCase();

    return name.includes(query) || code.includes(query);
  });

  return (
    <>
      <section className='panel' hidden={!active}>
        <div className='section-heading'>
          <div>
            <h2>فهرست محصولات</h2>
            <p>{products.length} محصولات موجود در فروشگاه</p>
          </div>
        </div>

        {error && (
          <p className='error-message' role='alert'>
            {error}
          </p>
        )}

        {loading ? (
          <p className='empty-state'>در حال بارگذاری محصولات</p>
        ) : products.length === 0 ? (
          <p className='empty-state'>محصولی در فروشگاه وجود ندارد.</p>
        ) : (
          <div className='table-wrapper'>
            <button type='button' onClick={() => void handleAdjustAllPrices()}>
              افزایش / کاهش کلی قیمت
            </button>

            <div className='search-box'>
              <input
                type='search'
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder='جست‌وجو بر اساس نام یا کد محصول'
                aria-label='جست‌وجوی محصولات'
              />
              {searchQuery.trim() !== '' && (
                <button type='button' onClick={() => setSearchQuery('')}>
                  پاک کردن جست‌وجو
                </button>
              )}
            </div>

            <table>
              <thead>
                <tr>
                  <th>نام محصول</th>
                  <th>کد محصول</th>
                  <th>قیمت نهایی: تومان</th>
                  <th>موجودی</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => {
                  const rate = ratesByCurrency.get(product.currencyCode);
                  const isExpanded = expandedProductId === product.id;

                  return (
                    <Fragment key={product.id}>
                      <tr
                        className='product-row'
                        onClick={() =>
                          setExpandedProductId((currentId) =>
                            currentId === product.id ? null : (product.id ?? null),
                          )
                        }
                        aria-expanded={isExpanded}
                        style={{ cursor: 'pointer' }}
                      >
                        <td className='product-name'>{product.name}</td>
                        <td>{product.code || '---'}</td>
                        <td>{formatTomanPrice(product, rate)}</td>
                        <td>
                          <span
                            className={
                              (product.stockQuantity ?? 0) === 0 ? 'stock-empty' : 'stock-available'
                            }
                          >
                            {numberFormatter.format(product.stockQuantity ?? 0)} عدد
                          </span>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr key={`${product.id}-details`} className='product-details-row'>
                          <td colSpan={4}>
                            <div
                              className='product-details'
                              onClick={(event) => event.stopPropagation()}
                            >
                              <h3>جزئیات محصول: {product.name}</h3>

                              <p>
                                <strong>کد محصول:</strong> {product.code || '---'}
                              </p>
                              <p>
                                <strong>ارز اصلی:</strong>{' '}
                                {formatCurrencyCode(product.currencyCode)}
                              </p>
                              <p>
                                <strong>قیمت پایه:</strong>{' '}
                                {formatForeignPrice(
                                  product.foreignPriceMinor,
                                  product.currencyCode,
                                )}{' '}
                                {formatCurrencyCode(product.currencyCode)}
                              </p>
                              <p>
                                <strong>قیمت اولیه:</strong> {formatBaseTomanPrice(product, rate)}
                              </p>
                              <p>
                                <strong>قیمت نهایی:</strong> {formatTomanPrice(product, rate)}
                              </p>
                              <p>
                                <strong>درصد تغییر قیمت:</strong>{' '}
                                {getPercentChange(product.priceMultiplierBps ?? 10000)}٪
                              </p>
                              <p>
                                <strong>موجودی:</strong>{' '}
                                {numberFormatter.format(product.stockQuantity ?? 0)} عدد
                              </p>

                              <div className='row-actions'>
                                <button
                                  type='button'
                                  className='small-button'
                                  onClick={() => setSellingProduct(product)}
                                >
                                  ثبت فروش
                                </button>

                                <button
                                  type='button'
                                  className='secondary-button small-button'
                                  onClick={() => void handleSetStock(product)}
                                >
                                  تنظیم موجودی
                                </button>

                                <button
                                  type='button'
                                  className='small-button'
                                  onClick={() => void handleSetPriceAdjustment(product)}
                                >
                                  تغییر درصد قیمت
                                </button>

                                <button
                                  type='button'
                                  className='secondary-button small-button'
                                  onClick={() => handleEdit(product)}
                                >
                                  ویرایش
                                </button>

                                <button
                                  type='button'
                                  className='danger-button small-button'
                                  onClick={() => void handleDelete(product)}
                                >
                                  حذف
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {sellingProduct && (
        <SaleDialog
          key={sellingProduct.id}
          product={sellingProduct}
          rate={ratesByCurrency.get(sellingProduct.currencyCode)}
          onClose={() => setSellingProduct(null)}
          onConfirm={async (sale) => {
            await sellProduct(sellingProduct, sale);
            setSellingProduct(null);
          }}
        />
      )}
    </>
  );
}
