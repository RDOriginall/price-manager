import {
  Fragment,
  useCallback,
  useEffect,
  useState,
  useRef,
  type ChangeEvent,
  type FormEvent,
} from 'react';

import { CURRENCIES } from './data/currenties';
import type { CurrencyCode } from './data/currenties';
import {
  addProduct,
  deleteProduct,
  getProducts,
  updateProduct,
  setProductStock,
  setProductPriceMultiplier,
  adjustAllProductPrices,
} from './db/productRepository';

import {
  getAllExchangeRates,
  saveManualExchangeRate,
} from './db/exchangeRateRepository'

import {
  recordSale,
  getSalesHistory,
} from './db/salesRepository';

import type { Product, ExchangeRate, SaleRecord, } from './types/models';
import { exportBackup, importBackup } from './utils/backup';
// import './App.css';

import { exportSalesToExcel } from './utils/exportSalesToExcel';

type ProductForm = {
  name: string;
  code: string;
  currencyCode: CurrencyCode;
  foreignPriceMinor: string;
};

const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  Toman: 'تومان',
  USD: 'دلار آمریکا',
  AED: 'درهم امارات',
  EUR: 'یورو',
  CNY: 'یوان چین',
};

const INITIAL_FORM : ProductForm = {
  name: '',
  code: '',
  currencyCode: 'USD',
  foreignPriceMinor: '',
};

// Rate management
const numberFormatter = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 0 });

const dateFormatter = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short', timeStyle: 'short' });


function parsePriceToMinor(
  value: string,
  currencyCode: CurrencyCode,
): number {
  const normalized = value.trim();

  const pattern =
    currencyCode === 'Toman'
      ? /^\d+$/
      : /^\d+(?:\.\d{1,2})?$/;

  if (!pattern.test(normalized)) {
    throw new Error(
      currencyCode === 'Toman'
        ? 'قیمت تومانی باید عدد صحیح و مثبت باشد.'
        : 'قیمت باید عددی مثبت با حداکثر دو رقم اعشار باشد.',
    );
  }

  const amount = Number(normalized);
  const result =
    currencyCode === 'Toman'
      ? amount
      : Math.round(amount * 100);

  if (!Number.isSafeInteger(result) || result < 0) {
    throw new Error('قیمت واردشده نامعتبر یا بیش از حد بزرگ است.');
  }

  return result;
}

function formatForeignPrice(
  minor: number,
  currencyCode: CurrencyCode,
): string {
  if (currencyCode === 'Toman') {
    return numberFormatter.format(minor);
  }

  return (minor / 100).toFixed(2);
}

// Rate management
function calculateTomanPrice(
  product: Product,
  rate: ExchangeRate,
): bigint {
  const numerator = BigInt(product.foreignPriceMinor) * BigInt(rate.rateToToman)

  // round to the nearest whole Toman.
  return (numerator + 50n) / 100n
}

// Rate management
function formatTomanPrice(
  product: Product,
  rate: ExchangeRate | undefined,
): string {
  const basePrice =
    product.currencyCode === 'Toman'
      ? product.foreignPriceMinor
      : rate
        ? Number(calculateTomanPrice(product, rate))
        : null;

  if (basePrice === null) return 'نرخ ثبت نشده';

  const multiplier = product.priceMultiplierBps ?? 10000;
  const finalPrice = Math.round((basePrice * multiplier) / 10000);

  return `${numberFormatter.format(finalPrice)} تومان`;
}

// Rate management
function formatRialPrice(
  product: Product,
  rate: ExchangeRate | undefined,
): string {
  if (!rate) return 'نرخ ثبت نشده';

  const toman = calculateTomanPrice(product, rate);
  return `${numberFormatter.format(toman * 10n)} ریال`
}


function getErrorMessage(error: unknown): string {
  return error instanceof Error
  ? error.message: 'خطای غیرمنتظره‌ای رخ داد'
}


// Tab base ui
const TABS = [
  { id: 'products', label: 'محصولات', icon: <path d='M21 8 12 3 3 8m18 0-9 5m9-5v8l-9 5m0-8L3 8m9 5v8M3 8v8l9 5' /> },
  { id: 'form', label: 'افزودن', icon: <path d='M12 8v8m-4-4h8M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' /> },
  { id: 'sales', label: 'فروش', icon: <path d='M4 20V10m6 10V4m6 16v-7m4 7H2' /> },
  { id: 'rates', label: 'نرخ ارز', icon: <path d='M7 7h13l-3-3m3 13H7l3 3M4 7h0m0 10h0' /> },
] as const;
type TabId = (typeof TABS)[number]['id'];



function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  // Rate management
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [form, setForm] = useState<ProductForm>(INITIAL_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  // tab base ui
  const [tab, setTab] = useState<TabId>('products');
        useEffect(() => {if (editingId !== null) setTab('form');}, [editingId]);
        useEffect(() => {window.scrollTo({ top: 0 });}, [tab]);
  // Rate management
  const [rateCurrencyCode, setRateCurrencyCode] = useState<CurrencyCode>('USD');
  // Rate management
  const [rateInput, setRateInput] = useState('');
  const [error, setError] = useState('');
  // Rate management
  const [rateError, setRateError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Rate management
  const [savingRate, setSavingRate] = useState(false);
  // search 
  const [searchQuery, setSearchQuery] = useState('');
  // expander
  const [expandedProductId, setExpandedProductId] = useState<number | null>(null,);
  // backup
  const importInputRef = useRef<HTMLInputElement>(null);




// const refreshProducts = useCallback(async () => {
//   try {
//     setProducts(await getProducts());
//   } catch (err) {
//     setError(`خواندن محصولات ناموفق بود: ${getErrorMessage(err)}`);
//   } finally {
//     setLoading(false);
//   }
// }, []);


const refreshProducts = useCallback(async () => {
  try {
    const products = await getProducts();

    // console.log('Products returned by getProducts:', products.length);
    // console.log('Products data:', products);

    setProducts(products);
  } catch (err) {
    setError(`خواندن محصولات ناموفق بود: ${getErrorMessage(err)}`);
  } finally {
    setLoading(false);
  }
}, []);

const refreshSales = useCallback(async () => {
  try {
    setSales(await getSalesHistory());
  } catch (err) {
    setError(
      `خواندن تاریخچه فروش ناموفق بود: ${getErrorMessage(err)}`,
    );
  }
}, []);

// Rate management
const refreshRates = useCallback(async () => {
  try {
    setRates(await getAllExchangeRates());
  } catch (err) {
    setRateError(`خواندن نرخ‌ها ناموفق بود ${getErrorMessage(err)}`);
  }
}, [])



useEffect(() => {
  void refreshProducts();
  //Rate management
  void refreshRates();
  void refreshSales();
}, [refreshProducts, refreshRates, refreshSales,]);


// Rate management
const ratesByCurrency = new Map(
  rates.map((rate) => [rate.currencyCode, rate]),
);

// Monthly and Yearly calculation
const now = new Date();

const todaySales = sales.filter((sale) => {
  const date = new Date(sale.soldAt);

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
});

const monthSales = sales.filter((sale) => {
  const date = new Date(sale.soldAt);

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
});

const todayRevenue = todaySales.reduce(
  (total, sale) => total + sale.totalPriceToman,
  0,
);

const monthRevenue = monthSales.reduce(
  (total, sale) => total + sale.totalPriceToman,
  0,
);

const todayQuantity = todaySales.reduce(
  (total, sale) => total + sale.quantity,
  0,
);

const monthQuantity = monthSales.reduce(
  (total, sale) => total + sale.quantity,
  0,
);


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

// Rate management
async function handleRateSubmit(event: FormEvent<HTMLFormElement>,) {
  event.preventDefault();
  setRateError('');
  setSavingRate(true);

  try {
    const rate = Number(rateInput.trim());

    if (!Number.isSafeInteger(rate) || rate <= 0) {
      throw new Error(
        'نرخ ارز باید یک عدد صحیح مثبت به تومان باشد'
      );
    }

    await saveManualExchangeRate(rateCurrencyCode, rate);
    setRateInput('');
    await refreshRates();
  } catch (err) {
    setRateError(getErrorMessage(err));
  } finally {
    setSavingRate(false);
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

  const input = window.prompt(
    `تعداد فروش برای «${product.name}» را وارد کنید:`,
    '1',
  );

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
    alert(
      `فروش ثبت شد.\nتعداد رکوردهای تاریخچه فروش: ${history.length}`,
    );
  } catch (err) {
    setError(`ثبت فروش ناموفق بود: ${getErrorMessage(err)}`);
  }
}


const handleSetPriceAdjustment = async (product: Product) => {
  if (product.id === undefined) {
    setError('شناسه محصول نامعتبر است.');
    return;
  }

  const currentPercent =
    (product.priceMultiplierBps ?? 10000) / 100 - 100;

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
    setError(
      error instanceof Error
        ? error.message
        : 'تغییر درصد قیمت انجام نشد.',
    );
  }
};



const filteredProducts = products.filter((product) => {
  const query = searchQuery.trim().toLocaleLowerCase();

  if (!query) return true;

  const name = product.name.toLocaleLowerCase();
  const code = (product.code ?? '').toLocaleLowerCase();

  return name.includes(query) || code.includes(query);
});



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
    setError(
      error instanceof Error
        ? error.message
        : 'تغییر کلی قیمت محصولات انجام نشد.',
    );
  }
};


async function handleExportSales() {
  try {
    await exportSalesToExcel();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'خطا در خروجی گرفتن از تاریخچه فروش';

    alert(message);
  }
}

// backup
async function handleExportBackup() {
  try {
    await exportBackup();
  } catch (error) {
    alert(getErrorMessage(error));
  }
}

async function handleImportBackup(event: ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;

  if (!confirm('با بازیابی بک‌آپ، تمام اطلاعات فعلی جایگزین می‌شود. ادامه می‌دهید؟')) {
    return;
  }

  try {
    await importBackup(file);
    window.location.reload();
  } catch (error) {
    alert(getErrorMessage(error));
  }
}


// --------------------------------- main return ----------------------------------

return (
  <main className='app-shell' dir='rtl'>
    <header className='app-header'>
      
      <div>
        <p className='eyebrow'>مدیریت فروشگاه</p>
        <h1>مدیریت قیمت محصولات</h1>
        <p className='subtitle'>مدیریت ارزی و محصولات فروشگاه</p>
      </div>

      {/* <span className='offline-badge'/>
        <span className="status-dot">
          اطلاعات محلی
        </span>
       */}
    
    </header>

    <nav className='tab-bar' aria-label='بخش‌های برنامه'>
      {TABS.map((t) => (
      <button
        key={t.id}
        type='button'
        className='tab'
        aria-current={tab === t.id ? 'page' : undefined}
        onClick={() => setTab(t.id)}
      >
        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>{t.icon}</svg>
        <span>{t.label}</span>
      </button>
      ))}
    </nav>

    <section className='panel' hidden={tab !== 'sales'}>
      <div className='section-heading'>
        <div>
          <h2>گزارش فروش</h2>
          <p>خلاصه عملکرد فروشگاه</p>
        </div>
      </div>

      <div className='dashboard-grid'>
        <article className='stat-card'>
          <h3>فروش امروز</h3>
          <p>{numberFormatter.format(todayRevenue)} تومان</p>
        </article>

        <article className='stat-card'>
          <h3>فروش این ماه</h3>
          <p>{numberFormatter.format(monthRevenue)} تومان</p>
        </article>

        <article className='stat-card'>
          <h3>کالای فروخته‌شده امروز</h3>
          <p>{numberFormatter.format(todayQuantity)}</p>
        </article>

        <article className='stat-card'>
          <h3>کالای فروخته‌شده این ماه</h3>
          <p>{numberFormatter.format(monthQuantity)}</p>
        </article>
      </div>
    </section>

    <section className='panel' hidden={tab !== 'rates'}>
      <div className='section-heading'>
        <div>
          <h2>مدیریت نرخ ارز</h2>
          <p>
            نرخ هر واحد ارز را به تومان وارد کنید، مثلا نرخ یک دلار
          </p>
        </div>
      </div>

      <form className='product-form' onSubmit={handleRateSubmit}>
        <label>ارز
          <select value={rateCurrencyCode} onChange={(event) => 
            setRateCurrencyCode(event.target.value as CurrencyCode,)}>
              {CURRENCIES.filter((currency) => currency.code !== 'Toman').map(
                (currency) =>
               ( 
              <option key={currency.code} value={currency.code}>
                {CURRENCY_LABELS[currency.code]} ({currency.code}) 
              </option>
            ),
          )}
          </select>
        </label>

        <label>نرخ هر ارز به تومان
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
                <td colSpan={4} className='empty-state'>هنوز نرخ ارزی ثبت نکرده‌اید</td>
              </tr>
            ) : (
              rates.map((rate) => (
                <tr key={rate.currencyCode}>
                  <td>
                    {CURRENCY_LABELS[rate.currencyCode]} (
                      {rate.currencyCode}
                    )
                  </td>
                  <td>
                    {numberFormatter.format(rate.rateToToman)} تومان
                  </td>
                  <td>
                    {dateFormatter.format(new Date(rate.updatedAt))}
                  </td>
                  <td>
                    {rate.source === 'manual' ? 'دستی' : 'آنلاین'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>

    

    <section className='panel' hidden={tab !== 'form'}>

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
            onChange={(event) => setForm({ ...form, name: event.target.value })
                    
          }
            placeholder='نام محصول را وارد کنید'
            />
        
        </label>

        <label>
          کد محصول (اختیاری)

          <input
            maxLength={80}
            value={form.code}
            onChange={(event) => setForm({ ...form, code: event.target.value})
          }
          placeholder='کد محصول را وارد کنید'
          />
        </label>
        
        <label>
          واحد پول
          <select
            value={form.currencyCode}
            onChange={(event) => setForm({ ...form, currencyCode: event.target.value as CurrencyCode,})}
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
            onChange={(event) => setForm({ ...form, foreignPriceMinor: event.target.value })
          }
            placeholder='قیمت محصول را وارد کنید'
          />
        </label>

        {error && (
          <p className='error-message' role='alert'> {error} </p>
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

    <section className='panel' hidden={tab !== 'products'}>
      <div className='section-heading'>
        <div>
          <h2>فهرست محصولات</h2>
          <p>{products.length} محصولات موجود در فروشگاه</p>
        </div>
      </div>

      {loading ? (
        <p className='empty-state'>در حال بارگذاری محصولات</p>
      ) : products.length === 0 ? (
        <p className='empty-state'>محصولی در فروشگاه وجود ندارد.</p>
      ) : (
        <div className='table-wrapper'>

          <button
            type="button"
            onClick={() => void handleAdjustAllPrices()}
          >
            افزایش / کاهش کلی قیمت
          </button>

          <div className="search-box">
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="جست‌وجو بر اساس نام یا کد محصول"
              aria-label="جست‌وجوی محصولات"
            />
            {searchQuery.trim() !== '' && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
              >
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
                      className="product-row"
                      onClick={() =>
                        setExpandedProductId((currentId) =>
                          currentId === product.id ? null : (product.id ?? null),
                        )
                      }
                      aria-expanded={isExpanded}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="product-name">{product.name}</td>
                      <td>{product.code || '---'}</td>
                      <td>{formatTomanPrice(product, rate)}</td>
                      <td>
                        <span
                          className={
                            (product.stockQuantity ?? 0) === 0
                              ? 'stock-empty'
                              : 'stock-available'
                          }
                        >
                          {numberFormatter.format(product.stockQuantity ?? 0)} عدد
                        </span>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr key={`${product.id}-details`} className="product-details-row">
                        <td colSpan={4}>
                          <div
                            className="product-details"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <h3>جزئیات محصول: {product.name}</h3>

                            <p>
                              <strong>کد محصول:</strong> {product.code || '---'}
                            </p>
                            <p>
                              <strong>ارز اصلی:</strong> {product.currencyCode}
                            </p>
                            <p>
                              <strong>قیمت پایه:</strong>{' '}
                              {formatForeignPrice(
                                product.foreignPriceMinor,
                                product.currencyCode,
                              )}{' '}
                              {product.currencyCode}
                            </p>
                            <p>
                              <strong>قیمت نهایی:</strong> {formatTomanPrice(product, rate)}
                            </p>
                            <p>
                              <strong>قیمت به ریال:</strong> {formatRialPrice(product, rate)}
                            </p>
                            <p>
                              <strong>درصد تغییر قیمت:</strong>{' '}
                              {((product.priceMultiplierBps ?? 10000) / 100) - 100}٪
                            </p>
                            <p>
                              <strong>موجودی:</strong>{' '}
                              {numberFormatter.format(product.stockQuantity ?? 0)} عدد
                            </p>

                            <div className="row-actions">
                              <button
                                type="button"
                                className="small-button"
                                onClick={() => void handleSell(product)}
                              >
                                ثبت فروش
                              </button>

                              <button
                                type="button"
                                className="secondary-button small-button"
                                onClick={() => void handleSetStock(product)}
                              >
                                تنظیم موجودی
                              </button>

                              <button
                                type="button"
                                className="small-button"
                                onClick={() => void handleSetPriceAdjustment(product)}
                              >
                                تغییر درصد قیمت
                              </button>

                              <button
                                type="button"
                                className="secondary-button small-button"
                                onClick={() => handleEdit(product)}
                              >
                                ویرایش
                              </button>

                              <button
                                type="button"
                                className="danger-button small-button"
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


    <section className='panel' hidden={tab !== 'sales'}>
      
      <div className='section-heading'>
        <div>
          <h2>تاریخچه فروش</h2>
          <p>{sales.length} گزارش فروش ثبت‌شده</p>
        </div>

        <button
          type='button'
          onClick={handleExportSales}
          disabled={sales.length === 0}
        >
          دانلود تاریخچه فروش
        </button>
        <button type='button' onClick={handleExportBackup}>
          دریافت بک‌آپ
        </button>

        <button type='button' onClick={() => importInputRef.current?.click()}>
          بازیابی بک‌آپ
        </button>

        <input
          ref={importInputRef}
          type='file'
          accept='application/json,.json'
          hidden
          onChange={handleImportBackup}
        />
      </div>


      {sales.length === 0 ? (
        <p className='empty-state'>هنوز فروشی ثبت نشده است</p>
      ) : (
        <div className='table-wrapper'>
          <table>
            <thead>
              <tr>
                <th>تاریخ فروش</th>
                <th>نام محصول</th>
                <th>کد محصول</th>
                <th>تعداد</th>
                <th>قیمت واحد: تومان</th>
                <th>مبلغ کل: تومان</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td>
                    {dateFormatter.format(new Date(sale.soldAt))}
                  </td>
                  <td>{sale.productName}</td>
                  <td>{sale.productCode}</td>
                  <td>{numberFormatter.format(sale.quantity)}</td>
                  <td>{numberFormatter.format(sale.unitPriceToman)}</td>
                  <td>{numberFormatter.format(sale.totalPriceToman)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }
    </section>


  <footer className='app-footer'>
    <p>
    اطلاعات فقط روی همین دستگاه ذخیره می‌شود، پس{' '}
    <button type='button' className='link-button' onClick={() => setTab('sales')}>
      بک‌آپ بگیرید
    </button>
    . نرخ ارز را خودتان وارد می‌کنید و برنامه بدون اینترنت هم کار می‌کند.
    </p>
    <p className='version'>v1.1.0</p>
  </footer>
</main>
  
  );
}

export default App;


