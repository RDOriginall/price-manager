import { useEffect, useState } from 'react';
import { AppFooter } from './components/AppFooter';
import { AppHeader } from './components/AppHeader';
import { ProductFormTab } from './components/ProductFormTab';
import { ProductsTab } from './components/ProductsTab';
import { RatesTab } from './components/RatesTab';
import { SalesTab } from './components/SalesTab';
import { TabBar } from './components/TabBar';
import type { TabId } from './data/tabs';
import { useExchangeRates } from './hooks/useExchangeRates';
import { useProductActions } from './hooks/useProductActions';
import { useProductForm } from './hooks/useProductForm';
import { useProducts } from './hooks/useProducts';
import { useSales } from './hooks/useSales';

function App() {
  const [tab, setTab] = useState<TabId>('products');

  const { products, loading, error, setError, refreshProducts } = useProducts();
  const { sales, refreshSales } = useSales(setError);
  const { rates, rateError, saveRate } = useExchangeRates();

  const { form, setForm, editingId, saving, resetForm, handleSubmit, handleEdit } = useProductForm({
    refreshProducts,
    setError,
    rates,
  });

  const actions = useProductActions({
    products,
    editingId,
    resetForm,
    refreshProducts,
    refreshSales,
    setError,
  });

  useEffect(() => {
    if (editingId !== null) setTab('form');
  }, [editingId]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [tab]);

  return (
    <main className='app-shell' dir='rtl'>
      <AppHeader />
      <TabBar tab={tab} onChange={setTab} />

      <ProductsTab
        active={tab === 'products'}
        products={products}
        loading={loading}
        error={error}
        rates={rates}
        handleEdit={handleEdit}
        {...actions}
      />

      <ProductFormTab
        active={tab === 'form'}
        form={form}
        setForm={setForm}
        editingId={editingId}
        saving={saving}
        error={error}
        handleSubmit={handleSubmit}
        resetForm={resetForm}
      />

      <SalesTab active={tab === 'sales'} sales={sales} />

      <RatesTab
        active={tab === 'rates'}
        rates={rates}
        rateError={rateError}
        onSaveRate={saveRate}
      />

      <AppFooter onBackupClick={() => setTab('sales')} />
    </main>
  );
}

export default App;
